# Avaliação da etapa User Stories

- Unidade: presenca-ata-final.
- Data local: 25/11/2026, America/Sao_Paulo.
- Fonte: [requisitos aprovados](../../requirements/presenca-ata-final/requirements.md).
- Decisão: executar a etapa, com oito histórias curtas e critérios observáveis.

## Justificativa

- [x] Novas interações visíveis: informar código, autenticar no aparelho, copiar/renovar código e marcar presença de outra pessoa.
- [x] Papéis com permissões diferentes: participante, administrador da comissão e editor da ata.
- [x] Jornadas com alternativas: Android/iOS, web, cancelamento, ausência de autenticação local e intervenção do administrador.
- [x] Critérios que precisam ficar explícitos: primeiro voto sem presidente, aprovação por maioria, falha de PDF e documento final imutável.

As histórias permitirão verificar os fluxos completos sem confundir biometria com autorização da API, marcação da prévia com presença real ou maioria com exportação concluída. Os requisitos PA-01 a PA-18 já foram aprovados; não é necessário perguntar novamente sobre papéis, formato do código ou o horário de liberação.

## Limites

Usar os papéis existentes; não inventar idade, profissão ou características pessoais. Não acrescentar funcionalidades, mudar as decisões aprovadas nem declarar corrigido o comportamento de voto que não foi reproduzido. Esta etapa não define endpoints, migrações ou algoritmos de concorrência; esses detalhes pertencem ao desenho e ao plano de implementação.

O [plano de geração](story-generation-plan.md) delimita os documentos e a rastreabilidade.
