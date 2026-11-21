// Sessão simulada para os testes que passam pelo requireAuth sem subir o Better
// Auth: o token de teste "teste-<id>" vira uma sessão do usuário <id>; qualquer
// outro valor é sessão inválida. É função comum (não jest.fn) para sobreviver ao
// jest.resetAllMocks() dos testes.
//
// Uso:
//   const { criarAuthSimulado, tokenDe } = await import('./sessaoSimulada.mjs');
//   jest.unstable_mockModule('../src/lib/auth.ts', criarAuthSimulado);
//   ...set('Authorization', `Bearer ${tokenDe(1)}`)
export const tokenDe = (userId) => `teste-${userId}`;

export const criarAuthSimulado = () => ({
  CABECALHO_IP: 'x-better-meet-ip',
  auth: {
    api: {
      getSession: async ({ headers }) => {
        const encontrado = /^Bearer teste-(\d+)$/.exec(
          headers.get('authorization') ?? '',
        );
        return encontrado
          ? { user: { id: encontrado[1] }, session: { id: 1 } }
          : null;
      },
    },
  },
});
