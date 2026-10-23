import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const jwtSecret = 'segredo-ficticio-dos-testes-de-exclusao';
const sendMail = jest.fn();
const prisma = {
  user: {
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  organizacaoMembro: { findMany: jest.fn(), update: jest.fn() },
  comissaoEquipe: { findMany: jest.fn() },
  organizacao: { deleteMany: jest.fn() },
  $transaction: jest.fn(),
};
jest.unstable_mockModule('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail }) },
}));
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({
  env: {
    JWT_SECRET: jwtSecret,
    GMAIL_USER: 'bettermeet@example.test',
    GMAIL_APP_PASSWORD: 'senha-de-app',
    MAIL_FROM_NAME: 'Better Meet',
  },
}));
const { default: usuarioRoutes } =
  await import('../src/routes/usuarioRoutes.ts');
const { handleError } = await import('../src/middlewares/errorMiddleware.ts');
const app = express();
app.use(express.json());
app.use('/api', usuarioRoutes);
app.use(handleError);

const ADMIN_ID = 1;
const OUTRO_ADMIN_ID = 2;
const USUARIO_ID = 3;

// usuários gravados no banco; o requireAuth confia no perfil daqui, não no token.
let usuariosNoBanco;

// Espera os envios disparados em segundo plano terminarem.
const aguardarSegundoPlano = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

const tokenFor = (userId) =>
  jwt.sign(
    { role: usuariosNoBanco[userId]?.role ?? 'USER', email: 'x@example.test' },
    jwtSecret,
    { subject: String(userId), expiresIn: '1h' },
  );
const excluir = (userId, rota, body = {}) =>
  request(app)
    .delete(`/api/usuarios/${userId}/${rota}`)
    .set('Authorization', `Bearer ${tokenFor(userId)}`)
    .send(body);

beforeEach(() => {
  jest.resetAllMocks();
  usuariosNoBanco = {
    [ADMIN_ID]: { id: ADMIN_ID, name: 'Ana Admin', role: 'ADMIN' },
    [OUTRO_ADMIN_ID]: { id: OUTRO_ADMIN_ID, name: 'Bia', role: 'USER' },
    [USUARIO_ID]: { id: USUARIO_ID, name: 'Caio', role: 'USER' },
  };
  sendMail.mockResolvedValue({});
  prisma.$transaction.mockImplementation((callback) => callback(prisma));
  prisma.user.findUnique.mockImplementation(async ({ where }) => {
    const usuario = usuariosNoBanco[where.id];
    return usuario
      ? { ...usuario, email: `usuario${where.id}@example.test` }
      : null;
  });
  prisma.user.count.mockImplementation(
    async ({ where }) =>
      Object.values(usuariosNoBanco).filter(
        (usuario) => usuario.role === where.role && usuario.id !== where.id.not,
      ).length,
  );
  prisma.user.update.mockImplementation(async ({ where, data }) => {
    Object.assign(usuariosNoBanco[where.id], data);
    return usuariosNoBanco[where.id];
  });
  prisma.user.delete.mockResolvedValue({});
  prisma.organizacaoMembro.findMany.mockResolvedValue([]);
  prisma.comissaoEquipe.findMany.mockResolvedValue([]);
});

describe('GET /usuarios/:id/unico-administrador', () => {
  test('informa quando o usuário é o único administrador', async () => {
    const response = await request(app)
      .get(`/api/usuarios/${ADMIN_ID}/unico-administrador`)
      .set('Authorization', `Bearer ${tokenFor(ADMIN_ID)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ unicoAdministrador: true });
  });

  test('usuário comum não é o único administrador', async () => {
    const response = await request(app)
      .get(`/api/usuarios/${USUARIO_ID}/unico-administrador`)
      .set('Authorization', `Bearer ${tokenFor(USUARIO_ID)}`);

    expect(response.body).toEqual({ unicoAdministrador: false });
  });
});

describe.each(['dados-pessoais', 'dados-completos'])(
  'DELETE /usuarios/:id/%s',
  (rota) => {
    test('único administrador sem sucessor é recusado (409)', async () => {
      const response = await excluir(ADMIN_ID, rota);

      expect(response.status).toBe(409);
      expect(response.body.error).toMatch(/único administrador/);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    test('recusa a si mesmo ou usuário inexistente como sucessor (409)', async () => {
      for (const novoAdministradorId of [ADMIN_ID, 999]) {
        const response = await excluir(ADMIN_ID, rota, {
          novoAdministradorId,
        });
        expect(response.status).toBe(409);
      }
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    test('promove o sucessor e avisa por e-mail', async () => {
      const response = await excluir(ADMIN_ID, rota, {
        novoAdministradorId: USUARIO_ID,
      });
      await aguardarSegundoPlano();

      expect(response.status).toBe(200);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: USUARIO_ID },
        data: { role: 'ADMIN' },
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: ADMIN_ID },
      });
      expect(sendMail).toHaveBeenCalledTimes(1);
      const email = sendMail.mock.calls[0][0];
      expect(email.to.address).toBe(`usuario${USUARIO_ID}@example.test`);
      expect(email.subject).toMatch(/administrador/);
      expect(email.text).toMatch(/Ana Admin excluiu a própria conta/);
    });

    test('com outro administrador, exclui sem pedir sucessor', async () => {
      usuariosNoBanco[OUTRO_ADMIN_ID].role = 'ADMIN';

      const response = await excluir(ADMIN_ID, rota);
      await aguardarSegundoPlano();

      expect(response.status).toBe(200);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(sendMail).not.toHaveBeenCalled();
    });

    test('usuário comum exclui sem pedir sucessor', async () => {
      const response = await excluir(USUARIO_ID, rota);

      expect(response.status).toBe(200);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  },
);
