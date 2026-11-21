// Roda os 3 serviços sob o PM2 pra que a management-better-meet consiga
// start/stop/restart neles pelo nome (api, monitoring e management). Uso: pm2 start ecosystem.config.js
//
// Os três iniciam direto de src/ por "node --experimental-strip-types", sem build
// (exige Node 24.9 ou superior, ver "engines" dos pacotes).
//
// Para facilitar o start de todos os serviços, pode-se usar o script "start-all.ps1".
//
// Este arquivo continua CommonJS: o PM2 o carrega com require.
const env = { TZ: process.env.TZ ?? 'America/Sao_Paulo' };

module.exports = {
  apps: [
    {
      name: 'api',
      cwd: './api',
      script: 'src/server.ts',
      node_args: '--experimental-strip-types',
      env,
    },
    {
      name: 'monitoring',
      cwd: './monitoring-better-meet',
      script: 'src/server.ts',
      node_args: '--experimental-strip-types',
      env,
    },
    {
      name: 'management',
      cwd: './management-better-meet/server',
      script: 'src/server.ts',
      node_args: '--experimental-strip-types',
      env,
    },
  ],
};
