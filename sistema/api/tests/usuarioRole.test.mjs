import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const jwtSecret = 'segredo-ficticio-dos-testes-de-perfil';
const prisma = {
  user: {
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({
  env: { JWT_SECRET: jwtSecret },
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

// perfil gravado no banco de cada pessoa; o requireAuth confia nele, não no token.
let rolesNoBanco;

const tokenFor = (userId, role) =>
  jwt.sign({ role, email: `usuario${userId}@example.test` }, jwtSecret, {
    subject: String(userId),
    expiresIn: '1h',
  });
const patchRole = (alvoId, role, { actorId = ADMIN_ID, tokenRole } = {}) =>
  request(app)
    .patch(`/api/usuarios/${alvoId}/role`)
    .set(
      'Authorization',
      `Bearer ${tokenFor(actorId, tokenRole ?? rolesNoBanco[actorId] ?? 'USER')}`,
    )
    .send({ role });

beforeEach(() => {
  jest.resetAllMocks();
  rolesNoBanco = {
    [ADMIN_ID]: 'ADMIN',
    [OUTRO_ADMIN_ID]: 'ADMIN',
    [USUARIO_ID]: 'USER',
  };
  prisma.$transaction.mockImplementation((callback) => callback(prisma));
  prisma.user.findUnique.mockImplementation(async ({ where }) => {
    const role = rolesNoBanco[where.id];
    return role ? { role, email: `usuario${where.id}@example.test` } : null;
  });
  prisma.user.count.mockImplementation(
    async ({ where }) =>
      Object.entries(rolesNoBanco).filter(
        ([id, role]) => role === where.role && Number(id) !== where.id.not,
      ).length,
  );
  prisma.user.update.mockImplementation(async ({ where, data }) => ({
    id: where.id,
    name: 'Pessoa',
    email: `usuario${where.id}@example.test`,
    role: data.role,
  }));
});

describe('PATCH /usuarios/:id/role', () => {
  test('admin promove um usuário comum', async () => {
    const response = await patchRole(USUARIO_ID, 'ADMIN');

    expect(response.status).toBe(200);
    expect(response.body.role).toBe('ADMIN');
    expect(response.body).not.toHaveProperty('password');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USUARIO_ID },
        data: { role: 'ADMIN' },
      }),
    );
  });

  test('admin rebaixa outro administrador quando ainda sobra um', async () => {
    const response = await patchRole(OUTRO_ADMIN_ID, 'USER');

    expect(response.status).toBe(200);
    expect(response.body.role).toBe('USER');
  });

  test('recusa rebaixar o único administrador (409)', async () => {
    // outra requisição rebaixou quem pediu entre a checagem de acesso e a
    // contagem: dentro da transação, o alvo já é o único administrador.
    prisma.user.count.mockResolvedValue(0);

    const response = await patchRole(OUTRO_ADMIN_ID, 'USER');

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/único administrador/);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  test('admin não altera o próprio perfil (403)', async () => {
    const response = await patchRole(ADMIN_ID, 'USER');

    expect(response.status).toBe(403);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  test('usuário comum não altera perfis (403)', async () => {
    const response = await patchRole(OUTRO_ADMIN_ID, 'USER', {
      actorId: USUARIO_ID,
    });

    expect(response.status).toBe(403);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  test('admin rebaixado perde o acesso mesmo com token antigo de ADMIN', async () => {
    rolesNoBanco[OUTRO_ADMIN_ID] = 'USER';

    const response = await patchRole(USUARIO_ID, 'ADMIN', {
      actorId: OUTRO_ADMIN_ID,
      tokenRole: 'ADMIN',
    });

    expect(response.status).toBe(403);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  test('conta excluída depois do login não autentica (401)', async () => {
    delete rolesNoBanco[OUTRO_ADMIN_ID];

    const response = await patchRole(USUARIO_ID, 'ADMIN', {
      actorId: OUTRO_ADMIN_ID,
      tokenRole: 'ADMIN',
    });

    expect(response.status).toBe(401);
  });

  test('usuário inexistente (404)', async () => {
    const response = await patchRole(999, 'ADMIN');

    expect(response.status).toBe(404);
  });

  test.each([
    ['perfil inválido', USUARIO_ID, 'DONO'],
    ['id malformado', 'abc', 'ADMIN'],
  ])('%s (400)', async (_caso, alvoId, role) => {
    const response = await patchRole(alvoId, role);

    expect(response.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
