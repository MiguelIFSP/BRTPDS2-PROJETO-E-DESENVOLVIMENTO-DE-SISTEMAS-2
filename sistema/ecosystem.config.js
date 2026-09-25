// Roda os 3 serviços sob o PM2 pra que a management-better-meet consiga
// start/stop/restart neles pelo nome. Uso: pm2 start ecosystem.config.js
//
// monitoring e management precisam de "npm run build" (tsc) antes, porque aqui
// rodam a partir de dist/server.js — não do ts-node-dev usado no "npm run dev".
// api não precisa de build: o próprio script/start dela já roda direto de src/
// via "node --experimental-strip-types".
//
//Para facilitar o start de todos os serviços, pode-se usar o script "start:all"
//do package.json da raiz, que roda "pm2 start ecosystem.config.js".
module.exports = {
  apps: [
    {
      name: 'api',
      cwd: './api',
      script: 'src/server.ts',
      node_args: '--experimental-strip-types',
    },
    {
      name: 'monitoring',
      cwd: './monitoring-better-meet',
      script: 'dist/server.js',
    },
    {
      name: 'management',
      cwd: './management-better-meet/server',
      script: 'dist/server.js',
    },
  ],
};
