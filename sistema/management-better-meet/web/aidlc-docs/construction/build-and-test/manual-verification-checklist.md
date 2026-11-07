# Lista de verificação manual - management-better-meet/web (SDK 58)

Pré-requisito: API de Dados (3333), de Monitoramento (3334) e de Gestão (3335) no ar. As URLs das APIs foram gravadas no bundle a partir do `.env` do `web` no momento do export.

Servidor estático temporário (encerrado pelo agente ao final): `http://localhost:4173/admin`

- [ ] 1. Abrir `http://localhost:4173/admin`: sem estar logado, redireciona para `/admin/login`.
- [ ] 2. Tela de login: título, campos de usuário e senha, ícone de escudo, botão "Entrar" com o ícone de entrada. Nenhum quadrado ou caractere estranho no lugar dos ícones (indica falha da fonte do Ionicons).
- [ ] 3. Botão do olho mostra e oculta a senha (ícones `eye-outline` e `eye-off-outline`).
- [ ] 4. Enviar vazio: mensagens de validação em pt-BR sob os campos.
- [ ] 5. Login com uma conta ADMIN: entra no painel (`/admin`), sem voltar para o login.
- [ ] 6. Painel: lista de subsistemas com status e ações (iniciar, parar, reiniciar) como antes.
- [ ] 7. Tema claro e escuro (se houver o botão no cabeçalho): cores corretas, sem fundo branco piscando.
- [ ] 8. Recarregar a página (F5) logado: **volta para a tela de login**. É o comportamento pretendido do app (`authStore.ts` não usa `persist`, para o painel admin exigir login a cada carregamento). A versão anterior desta lista dizia o contrário, por engano.
- [ ] 9. Sair (logout): volta para o login.
- [ ] 10. Console do navegador (F12): sem erro React #418 (corrigido no passo 10 do plano; testar com o navegador em modo escuro e em claro) e sem erros de fonte ou recurso 404.
- [ ] 11. Tema da conta: com a conta em tema escuro (salvo pelo botão do painel ou pelo app), fazer login e confirmar que o painel entra no escuro, mesmo depois de ter deixado o navegador em claro antes.
- [ ] 12. Logado, alternar o tema pelo botão, sair, fazer login de novo (ou F5 e login): o último tema escolhido deve voltar. Console sem erro do PATCH `/api/usuarios/:id/tema`.
- [ ] 13. Sem estar logado (tela de login), o botão de tema só muda a tela, sem chamar a API.
- [ ] 14. Botões por status no painel: subsistema Operacional ou em Instabilidade com **Iniciar** desabilitado (Parar e Reiniciar ativos); Fora do ar ou Em manutenção com só **Iniciar** ativo; Sem monitoramento ainda com os três ativos. API de Gestão fora do ar continua desabilitando todos.
