# Achados da Auditoria

## Identificação
- dominio: apis-integracoes
- run_id: 2026-04-12_08-28-28
- ultima_atualizacao: 2026-04-12 08:34:40

## Regras de Registro
- Registrar apenas achados reais com evidência observável.
- Não registrar opinião vaga sem base no repositório.
- Cada achado deve ter ID único dentro da run.
- Cada achado deve ter severidade definida.
- Se o item não for confirmado, registrar como hipótese com justificativa.

## Severidades Permitidas
- critico
- alto
- medio
- baixo
- informativo

## Status Permitidos
- aberto
- confirmado
- mitigado
- resolvido
- aceito
- nao_aplicavel

## Achados Registrados

### ACH-001
- titulo: Superficie tRPC consumida pelo frontend nao esta exposta nem inventariada
- severidade: critico
- categoria: superficie-de-integracao
- status: confirmado
- resumo: O frontend consome `/api/trpc/...` em fluxos centrais de autenticacao, onboarding e selecao de workspace, mas o repositorio nao contem handler HTTP/route tRPC nem bootstrap de servidor para expor essa superficie. O contrato real fica implicito e o consumidor aponta para uma integracao inexistente no codigo auditado.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(auth)/onboarding/page.tsx
- detalhe: A tela chama `fetch('/api/trpc/auth.completeOnboarding', ...)` diretamente.
- arquivo_ou_area: apps/web/src/app/(auth)/invite/page.tsx
- detalhe: A tela chama `fetch('/api/trpc/auth.acceptInvite', ...)` diretamente.
- arquivo_ou_area: apps/web/src/app/(auth)/reset-password/page.tsx
- detalhe: A tela chama `fetch('/api/trpc/auth.requestPasswordReset', ...)` diretamente.
- arquivo_ou_area: apps/web/src/app/(auth)/workspace/page.tsx
- detalhe: A tela chama `fetch('/api/trpc/auth.listWorkspaces')` diretamente.
- arquivo_ou_area: apps/api/src/index.ts
- detalhe: O entrypoint apenas inicializa tracing, logger, sentry e tenant middleware; nao registra servidor HTTP, route handler ou adaptador tRPC.
- arquivo_ou_area: apps/api/src/trpc/router.ts
- detalhe: O appRouter existe no codigo, mas nao ha no repositorio rota `route.ts`, `fetchRequestHandler` ou `createHTTPServer` conectando esse router a uma superficie acessivel.

#### Impacto
- tecnico: Fluxos centrais dependem de uma API nao exposta, inviabilizando consumo previsivel e impedindo validacao de contrato entre cliente e backend.
- negocio: Onboarding, aceite de convite, recuperacao de senha e selecao de workspace podem falhar integralmente, bloqueando entrada e ativacao de usuarios.

#### Recomendacao
- acao_sugerida: Definir uma unica superficie oficial para tRPC, publicar o handler correspondente e alinhar todos os consumidores a esse ponto de entrada com contrato documentado.
- prioridade: alta

#### Observacoes
- O pacote web declara dependencias de `@trpc/client`, `@trpc/next` e `@trpc/react-query`, mas nao ha cliente tRPC configurado em `apps/web/src`.

### ACH-002
- titulo: Fluxos expostos de onboarding e recuperacao de conta estao publicados com implementacoes placeholder
- severidade: critico
- categoria: contrato-quebrado
- status: confirmado
- resumo: O router de autenticacao expoe contratos para onboarding, reset de senha e verificacao de email como se estivessem operacionais, mas as implementacoes observadas estao incompletas ou falham por construcao.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/auth.ts
- detalhe: `completeOnboarding` instancia `new CompleteOnboarding(accountRepo, memberRepo)` sem fornecer `tenantRepo`, enquanto `resetPassword` e `verifyEmail` permanecem expostos como mutacoes publicas.
- arquivo_ou_area: packages/business/auth/use-cases/complete-onboarding.use-case.ts
- detalhe: O caso de uso lança `throw new Error('TenantRepo not provided')` quando o `tenantRepo` nao e injetado, tornando o contrato de onboarding inviavel.
- arquivo_ou_area: packages/business/auth/use-cases/reset-password.use-case.ts
- detalhe: O caso de uso lanca `throw new Error('Reset password token validation not yet implemented')`.
- arquivo_ou_area: packages/business/auth/use-cases/verify-email.use-case.ts
- detalhe: O caso de uso lanca `throw new Error('Email verification token validation not yet implemented')`.
- arquivo_ou_area: packages/business/auth/adapters/resend-email-sender.adapter.ts
- detalhe: Em producao, o adaptador apenas registra aviso de TODO e faz `console.log`, sem integracao real de envio.

#### Impacto
- tecnico: Contratos expostos nao representam comportamento executavel e devolvem falhas estruturais em fluxos essenciais de autenticacao.
- negocio: Novos clientes nao conseguem concluir onboarding com previsibilidade e usuarios nao contam com recuperacao/verificacao de conta funcional.

#### Recomendacao
- acao_sugerida: Remover da superficie publica os contratos ainda incompletos ou concluir a implementacao fim a fim antes de mantelos expostos.
- prioridade: alta

#### Observacoes
- `requestPasswordReset` gera token em memoria e monta URL, mas o ciclo de persistencia e validacao do token ainda nao existe.

### ACH-003
- titulo: Contrato de aceite de convite e incoerente entre consumidor publico e backend
- severidade: alto
- categoria: contrato-inconsistente
- status: confirmado
- resumo: O frontend trata o aceite de convite como fluxo publico orientado por token, mas o backend declara `publicProcedure` e logo em seguida exige conta autenticada para prosseguir. A precondicao real nao esta refletida no contrato consumido.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(auth)/invite/page.tsx
- detalhe: A pagina usa apenas o `token` da query string e envia `inviteToken`, `displayName` e `phone` para `/api/trpc/auth.acceptInvite`, sem exigir login previo.
- arquivo_ou_area: apps/api/src/routers/auth.ts
- detalhe: `acceptInvite` e declarado como `publicProcedure`, mas chama `const accountId = getAccountId(ctx)` antes de executar o caso de uso.
- arquivo_ou_area: apps/api/src/routers/auth.ts
- detalhe: A funcao `getAccountId` lanca `TRPCError({ code: 'UNAUTHORIZED' })` quando `ctx.tenant?.userId` nao existe.
- arquivo_ou_area: packages/business/auth/use-cases/accept-invite.use-case.ts
- detalhe: O caso de uso exige `accountId` e valida correspondencia entre email da conta autenticada e email do convite.

#### Impacto
- tecnico: Consumidores recebem falha de autenticacao em um fluxo anunciado como publico e orientado por token.
- negocio: Convites podem expirar ou gerar friccao operacional porque o usuario so descobre a necessidade de autenticacao no momento da chamada.

#### Recomendacao
- acao_sugerida: Tornar o contrato explicitamente autenticado com UX correspondente, ou refatorar o fluxo para aceitar e validar convites sem depender de sessao previa.
- prioridade: alta

#### Observacoes
- O nome da procedure induz uso publico, mas o comportamento real e de fluxo autenticado.

### ACH-004
- titulo: Confirmacao de campanha marca despacho como concluido sem integrar com envio real
- severidade: alto
- categoria: integracao-externa-fragil
- status: confirmado
- resumo: O contrato assincrono de campanhas sugere despacho de mensagens, mas a cadeia observada apenas enfileira um job, percorre destinatarios com logs e marca a campanha como `COMPLETED`, sem acionar envio efetivo.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/campaigns.ts
- detalhe: `confirm` adiciona job `send-campaign` em `wbc:campaigns` logo apos confirmar a campanha.
- arquivo_ou_area: apps/worker/src/processors/campaign-processor.ts
- detalhe: O worker lista recipients, registra logs e em seguida chama `campaignRepo.updateStatus(..., 'COMPLETED')`, com comentario dizendo que o envio sera tratado por outro processor.
- arquivo_ou_area: apps/worker/src/processors/messaging-processor.ts
- detalhe: O processor de mensageria contem apenas o comentario `Processor logic to be implemented when WhatsApp N2 integration is complete`.

#### Impacto
- tecnico: O estado assíncrono da campanha diverge do comportamento real e elimina rastreabilidade de entrega.
- negocio: Campanhas podem ser reportadas como concluidas sem que nenhuma mensagem tenha sido enviada ao cliente final.

#### Recomendacao
- acao_sugerida: Bloquear o status final ate haver dispatch real com rastreamento por destinatario, ou implementar a integracao de mensageria antes de expor a confirmacao como fluxo operacional.
- prioridade: alta

#### Observacoes
- O mesmo padrao de placeholder aparece nas rotas `connectMercadoPago` e `disconnectMercadoPago` em `apps/api/src/routers/finance.ts`.

### ACH-005
- titulo: Tratamento de erros da API e opaco para regras de negocio frequentes
- severidade: medio
- categoria: tratamento-de-erros
- status: confirmado
- resumo: A camada tRPC mapeia apenas um conjunto limitado de classes de erro, mas varios casos de uso ligados a autenticacao e gestao de workspace lancam `Error` generico. O consumidor fica exposto a respostas inconsistentes e menos automatizaveis.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/error-handler.ts
- detalhe: O mapeamento reconhece apenas listas fixas de nomes de erro; qualquer `Error` generico nao tipado sai desse contrato.
- arquivo_ou_area: packages/business/auth/use-cases/accept-invite.use-case.ts
- detalhe: O caso de uso lanca `Error` generico para convite nao encontrado, expirado, email divergente e membership existente.
- arquivo_ou_area: packages/business/auth/use-cases/complete-onboarding.use-case.ts
- detalhe: O caso de uso lanca `Error` generico para `Slug ja em uso`, `Account ja possui workspace`, `Account nao encontrada` e `TenantRepo not provided`.
- arquivo_ou_area: packages/business/auth/use-cases/switch-workspace.use-case.ts
- detalhe: O caso de uso lanca `Error('Acesso negado a este workspace')` em vez de erro de dominio tipado.

#### Impacto
- tecnico: Frontends e integracoes internas nao conseguem distinguir com estabilidade cenarios de validacao, conflito, autorizacao e falha estrutural.
- negocio: O troubleshooting fica mais caro e o comportamento percebido pelo usuario tende a virar erro generico em fluxos importantes.

#### Recomendacao
- acao_sugerida: Padronizar erros de dominio tipados para os fluxos de auth/workspace e expandir o mapeamento tRPC para devolver codigos e payloads consistentes.
- prioridade: media

#### Observacoes
- O problema aparece de forma recorrente em `packages/business/auth`, nao apenas nos exemplos citados.

### ACH-006
- titulo: Contratos de API, filas e eventos seguem implicitos no codigo sem estrategia visivel de evolucao
- severidade: medio
- categoria: documentacao-e-versionamento
- status: confirmado
- resumo: A superficie de integracao do projeto e definida principalmente por routers, schemas e codigo de filas/eventos, sem spec publicavel, inventario tecnico ou politica clara de compatibilidade. A unica versao observavel fica restrita ao endpoint de health.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/router.ts
- detalhe: O arquivo agrega toda a superficie de routers, mas nao referencia spec, inventario ou contrato distribuido aos consumidores.
- arquivo_ou_area: packages/validators/src
- detalhe: Os schemas existem no codigo, mas funcionam como contrato implicito de implementacao e nao como documentacao de integracao consumivel.
- arquivo_ou_area: packages/shared/src/events/event-subscriber.ts
- detalhe: Eventos sao registrados dinamicamente em memoria via `subscribe`, sem catalogo versionado ou contrato operacional associado.
- arquivo_ou_area: apps/api/src/routers/health.ts
- detalhe: A unica exposicao explicita de versao encontrada esta em `health.version`, sem estrategia equivalente para os demais contratos.

#### Impacto
- tecnico: Consumidores internos e futuros integradores dependem de leitura de codigo para entender shape, precondicoes e compatibilidade.
- negocio: Mudancas simples de contrato tem maior risco de drift e quebra silenciosa entre times e superficies do produto.

#### Recomendacao
- acao_sugerida: Publicar um inventario minimo das interfaces, contratos de evento e politica de evolucao/versionamento antes de ampliar a superficie de integracao.
- prioridade: media

#### Observacoes
- Nao foi localizada no repositorio spec OpenAPI, colecao Postman ou documentacao equivalente para essa superficie.
