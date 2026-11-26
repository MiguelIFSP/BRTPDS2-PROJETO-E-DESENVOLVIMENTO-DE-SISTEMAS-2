import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { StatusConviteReuniao, type Role } from '@prisma/client';
import prisma from '../config/database.ts';
import { env } from '../config/env.ts';
import { AppError } from '../errors/AppError.ts';
import { estadoDaReuniao, type EstadoReuniao } from '../utils/fusoHorario.ts';
import { podeGerirReuniao } from './permissaoReuniaoService.ts';

export const LIMITE_ARQUIVO_BYTES = 25 * 1024 * 1024;

const RAIZ = path.resolve(import.meta.dirname, '../../uploads/reunioes');

const MENSAGEM_ENCERRADA =
  'Esta reunião já terminou ou foi cancelada; a biblioteca só permite baixar.';
const MENSAGEM_ENVIO = 'Você não pode enviar arquivos nesta reunião.';
const MENSAGEM_VER = 'Você não pode ver esta reunião.';

const bibliotecaFechada = (estado: EstadoReuniao) =>
  estado === 'ENCERRADA' || estado === 'CANCELADA';

const pastaDaReuniao = (reuniaoId: number) => {
  const pasta = path.resolve(RAIZ, String(reuniaoId));
  if (pasta !== path.join(RAIZ, String(reuniaoId))) {
    throw new AppError(400, 'Identificador da reunião inválido.');
  }
  return pasta;
};

const caminhoDoArquivo = (reuniaoId: number, nomeArmazenado: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(nomeArmazenado)) {
    throw new AppError(404, 'Arquivo não encontrado.');
  }
  return path.join(pastaDaReuniao(reuniaoId), nomeArmazenado);
};

// O nome que a pessoa vê. Tira pasta e caracteres de controle; não vira caminho.
export const nomeSeguro = (bruto: string) => {
  const base = path.win32
    .basename(bruto.replaceAll('\\', '/'))
    .replace(/[\u0000-\u001f]/g, '')
    .trim();
  if (!base || base === '.' || base === '..') return 'arquivo';
  return base.slice(0, 255);
};

const acessoDaReuniao = async (
  userId: number,
  role: Role,
  reuniaoId: number,
) => {
  const reuniao = await prisma.reuniao.findUnique({
    where: { id: reuniaoId },
    select: {
      id: true,
      comissaoId: true,
      criadoPorUserId: true,
      status: true,
      data: true,
      horaInicio: true,
      horaFim: true,
      convites: {
        where: { userId, status: StatusConviteReuniao.ACEITO },
        select: { id: true },
      },
    },
  });
  if (!reuniao) throw new AppError(404, 'Reunião não encontrada.');
  const participa =
    reuniao.criadoPorUserId === userId || reuniao.convites.length > 0;
  const podeGerir = await podeGerirReuniao(userId, role, reuniao);
  if (!participa && !podeGerir) throw new AppError(403, MENSAGEM_VER);
  return {
    participa,
    podeGerir,
    estado: estadoDaReuniao(reuniao, env.TZ_REUNIOES).estado,
  };
};

const apresentar = (arquivo: {
  id: number;
  nomeOriginal: string;
  tamanhoBytes: number;
  createdAt: Date;
  enviadoPor: { id: number; name: string } | null;
}) => ({
  id: arquivo.id,
  nome: arquivo.nomeOriginal,
  tamanhoBytes: arquivo.tamanhoBytes,
  createdAt: arquivo.createdAt,
  enviadoPor: arquivo.enviadoPor,
});

const arquivoSelect = {
  id: true,
  nomeOriginal: true,
  tamanhoBytes: true,
  createdAt: true,
  enviadoPor: { select: { id: true, name: true } },
} as const;

export const arquivoReuniaoService = {
  async list(userId: number, role: Role, reuniaoId: number) {
    const acesso = await acessoDaReuniao(userId, role, reuniaoId);
    const arquivos = await prisma.arquivoReuniao.findMany({
      where: { reuniaoId },
      orderBy: { createdAt: 'asc' },
      select: arquivoSelect,
    });
    return {
      podeEnviar: acesso.podeGerir && !bibliotecaFechada(acesso.estado),
      arquivos: arquivos.map(apresentar),
    };
  },

  async criar(
    userId: number,
    role: Role,
    reuniaoId: number,
    arquivo: { nome: string; conteudo: Buffer },
  ) {
    const acesso = await acessoDaReuniao(userId, role, reuniaoId);
    if (!acesso.podeGerir) throw new AppError(403, MENSAGEM_ENVIO);
    if (bibliotecaFechada(acesso.estado)) {
      throw new AppError(409, MENSAGEM_ENCERRADA);
    }
    if (arquivo.conteudo.length === 0) {
      throw new AppError(400, 'O arquivo está vazio.');
    }
    if (arquivo.conteudo.length > LIMITE_ARQUIVO_BYTES) {
      throw new AppError(413, 'O arquivo passa de 25 MB.');
    }

    const nomeArmazenado = randomUUID();
    const pasta = pastaDaReuniao(reuniaoId);
    const destino = caminhoDoArquivo(reuniaoId, nomeArmazenado);
    await mkdir(pasta, { recursive: true });
    try {
      await writeFile(destino, arquivo.conteudo);
      const criado = await prisma.arquivoReuniao.create({
        data: {
          reuniaoId,
          nomeOriginal: nomeSeguro(arquivo.nome),
          nomeArmazenado,
          tamanhoBytes: arquivo.conteudo.length,
          enviadoPorUserId: userId,
        },
        select: arquivoSelect,
      });
      return apresentar(criado);
    } catch (error) {
      await unlink(destino).catch(() => undefined);
      throw error;
    }
  },

  async ler(userId: number, role: Role, reuniaoId: number, arquivoId: number) {
    await acessoDaReuniao(userId, role, reuniaoId);
    const arquivo = await prisma.arquivoReuniao.findFirst({
      where: { id: arquivoId, reuniaoId },
      select: { nomeOriginal: true, nomeArmazenado: true, tamanhoBytes: true },
    });
    if (!arquivo) throw new AppError(404, 'Arquivo não encontrado.');
    try {
      const conteudo = await readFile(
        caminhoDoArquivo(reuniaoId, arquivo.nomeArmazenado),
      );
      return {
        nome: arquivo.nomeOriginal,
        tamanhoBytes: arquivo.tamanhoBytes,
        conteudo,
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        throw new AppError(404, 'Arquivo não encontrado.');
      }
      throw error;
    }
  },

  async remover(
    userId: number,
    role: Role,
    reuniaoId: number,
    arquivoId: number,
  ) {
    const acesso = await acessoDaReuniao(userId, role, reuniaoId);
    if (!acesso.podeGerir) {
      throw new AppError(403, 'Você não pode apagar arquivos desta reunião.');
    }
    if (bibliotecaFechada(acesso.estado)) {
      throw new AppError(409, MENSAGEM_ENCERRADA);
    }
    const arquivo = await prisma.arquivoReuniao.findFirst({
      where: { id: arquivoId, reuniaoId },
      select: { id: true, nomeArmazenado: true },
    });
    if (!arquivo) throw new AppError(404, 'Arquivo não encontrado.');
    await prisma.arquivoReuniao.delete({ where: { id: arquivo.id } });
    await unlink(caminhoDoArquivo(reuniaoId, arquivo.nomeArmazenado)).catch(
      () => undefined,
    );
  },
};

export const removerPastaDaReuniao = async (reuniaoId: number) => {
  await rm(pastaDaReuniao(reuniaoId), { recursive: true, force: true }).catch(
    () => undefined,
  );
};
