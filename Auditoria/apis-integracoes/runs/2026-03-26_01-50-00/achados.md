# Achados da Auditoria

## Identificação
- dominio: apis-integracoes
- run_id: 2026-03-26_01-50-00
- ultima_atualizacao: 2026-03-26 02:10:00

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
- titulo: Domain errors nao mapeados para codigos tRPC — retornam HTTP 500 generico
- severidade: alto
- categoria: erros e contratos
- status: confirmado
- resumo: 12 classes de domain error (ClientNotFoundError, DuplicatePhoneError, OtpExpiredError, etc.) nao sao mapeadas para TRPCError codes. Quando lancadas, bubblam como INTERNAL_SERVER_ERROR (500) ao inves de NOT_FOUND (404) ou BAD_REQUEST (400).

#### Evidencia
- arquivo_ou_area: packages/business/*/domain/errors.ts (12 modulos), apps/api/src/routers/ (nenhum try-catch mapeando erros), apps/api/src/trpc/logging-middleware.ts (nao trata erros)
- detalhe: Apenas auth.ts tem 1 mapeamento explicito (TRPCError NOT_FOUND). Demais routers delegam para use-cases sem try-catch. Erros de dominio viram 500 no cliente.

#### Impacto
- tecnico: Consumidores (web e mobile) recebem 500 para erros previsiveis como "client not found" ou "duplicate phone". Impossivel distinguir erro de input de erro de servidor.
- negocio: UX degradada — app mobile nao pode mostrar mensagens de erro uteis. Dificulta debugging.

#### Recomendacao
- acao_sugerida: Criar error handler global em tRPC middleware que mapeie domain errors para codigos apropriados (NOT_FOUND, BAD_REQUEST, CONFLICT). Centralizar no trpc.ts como onError handler.
- prioridade: alta

#### Observacoes
- none

---

### ACH-002
- titulo: Ausencia de idempotencia em operacoes de criacao e mutacoes financeiras
- severidade: alto
- categoria: idempotencia e robustez
- status: confirmado
- resumo: Nenhuma mutation de criacao possui mecanismo de idempotencia. Retry por timeout de rede pode gerar vendas, clientes, pedidos e despesas duplicados. Operacoes financeiras (markPaid, createReturn, createExpense) sao especialmente criticas.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/sales.ts (create, confirm, markPaid, createReturn), clients.ts (create), inventory.ts (createOrder), campaigns.ts (create), finance.ts (createExpense)
- detalhe: Nenhum input schema aceita idempotencyKey. Nenhum mecanismo de deduplicacao existe. Nao ha constraint de unicidade por requestId no banco.

#### Impacto
- tecnico: Retry apos timeout pode criar dados duplicados. Particularmente perigoso em create sale + confirm (dupla cobranca).
- negocio: Risco financeiro direto — venda duplicada, pagamento contado duas vezes, estoque movimentado em dobro.

#### Recomendacao
- acao_sugerida: Adicionar campo opcional idempotencyKey nos inputs de create/confirm mutations. Armazenar resultado em Redis com TTL 24h. Retry com mesma key retorna resultado cacheado.
- prioridade: alta

#### Observacoes
- none

---

### ACH-003
- titulo: Ausencia de versionamento de API e estrategia de compatibilidade
- severidade: medio
- categoria: versionamento e compatibilidade
- status: confirmado
- resumo: Nao existe versionamento da API tRPC. Web e mobile consomem o mesmo router sem mecanismo de deprecacao ou compatibilidade. Mudanca breaking em schema Zod quebra ambos os clientes simultaneamente.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/router.ts, packages/validators/src/ (schemas sem versionamento)
- detalhe: Nao existe v1/v2 prefix, @deprecated decorators, changelog, nem migration path para consumidores. Monorepo ameniza em dev, mas nao elimina risco em deploy assimetrico.

#### Impacto
- tecnico: Mudanca em schema Zod de input/output quebra consumidores que nao atualizaram. Mobile (Expo) pode estar em versao diferente do web.
- negocio: Risco de downtime ao fazer deploy de mudancas na API.

#### Recomendacao
- acao_sugerida: Implementar versionamento por procedure ou por router (ex: v1.clients.list). Adicionar mecanismo de deprecacao. Para monorepo, garantir deploy atomico de api+web+mobile.
- prioridade: media

#### Observacoes
- Risco mitigado enquanto web e mobile sao deployados juntos do mesmo monorepo.

---

### ACH-004
- titulo: Ausencia de documentacao OpenAPI ou spec de API
- severidade: medio
- categoria: contratos e documentacao
- status: confirmado
- resumo: Nao existe OpenAPI spec, Swagger, ou qualquer documentacao gerada da API. 116 procedures em 16 routers sem documentacao consumivel por ferramentas externas ou desenvolvedores terceiros.

#### Evidencia
- arquivo_ou_area: raiz do repositorio (nenhum openapi.json, swagger.yml), package.json (sem trpc-openapi ou similar)
- detalhe: Schemas Zod existem e sao ricos, mas nao sao exportados como OpenAPI. Contratos sao legiveis apenas via codigo.

#### Impacto
- tecnico: Integracao externa (ex: parceiros, ferramentas de teste) depende de leitura manual do codigo.
- negocio: Dificulta onboarding de desenvolvedores e integracao com terceiros.

#### Recomendacao
- acao_sugerida: Instalar trpc-openapi ou equivalente para gerar spec automaticamente a partir dos schemas Zod existentes. Publicar em /api/docs.
- prioridade: media

#### Observacoes
- none

---

### ACH-005
- titulo: Integracao WhatsApp sem timeout, retry ou tratamento granular de erro
- severidade: medio
- categoria: robustez de integracao externa
- status: confirmado
- resumo: WhatsApp N2 adapter faz fetch sem timeout, sem retry com backoff, e com catch generico que nao distingue erros de rede, auth, rate limit ou API.

#### Evidencia
- arquivo_ou_area: packages/business/messaging/adapters/whatsapp-n2-adapter.ts (3 metodos: sendText, sendImage, sendAudio)
- detalhe: Nenhum dos 3 metodos define timeout no fetch. Catch blocks retornam { success: false, error: String(error) } sem distinção de tipo de falha.

#### Impacto
- tecnico: Chamada a WhatsApp pode travar indefinidamente. Erro temporario nao e retentado. Erro de rate limit nao e tratado.
- negocio: Mensagens podem nao ser enviadas sem retry. Latencia alta pode travar thread da API.

#### Recomendacao
- acao_sugerida: Adicionar AbortController com timeout de 10s. Implementar retry com backoff para erros 5xx e 429. Logar tipo de erro para diagnostico.
- prioridade: media

#### Observacoes
- DeepSeek adapter tem o mesmo problema (sem timeout, sem retry).

---

### ACH-006
- titulo: Integracao DeepSeek AI sem timeout nem retry
- severidade: baixo
- categoria: robustez de integracao externa
- status: confirmado
- resumo: deepseek-adapter.ts faz fetch para API de AI sem timeout e sem retry. Resposta lenta de LLM pode travar a request da API.

#### Evidencia
- arquivo_ou_area: packages/business/ai/adapters/deepseek-adapter.ts (fetch sem timeout)
- detalhe: Throw generico em !response.ok sem retry. Sem AbortController.

#### Impacto
- tecnico: Request de AI pode travar por minutos. Sem retry, falha temporaria e definitiva.
- negocio: Funcionalidades de AI indisponiveis em caso de instabilidade do provider.

#### Recomendacao
- acao_sugerida: Adicionar timeout de 30s. Implementar retry com backoff para 429/5xx. Considerar fallback gracioso.
- prioridade: baixa

#### Observacoes
- none

---

### ACH-007
- titulo: Bulk operations sem limite de tamanho de array
- severidade: baixo
- categoria: consumo de recursos
- status: confirmado
- resumo: bulkTag em clients.ts e recipientIds em campaigns.ts aceitam arrays sem .max(). Atacante pode enviar array com milhares de UUIDs causando DoS.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/clients.ts (bulkTag: z.array(uuidSchema) sem .max()), apps/api/src/routers/campaigns.ts (recipientIds: z.array(z.string().uuid()) sem .max())
- detalhe: Zod arrays sem constraint de tamanho maximo.

#### Impacto
- tecnico: Resource exhaustion via payload grande. Pode causar OOM ou timeout de banco.
- negocio: DoS em funcionalidades de tag e campanha.

#### Recomendacao
- acao_sugerida: Adicionar .max(1000) em clientIds e .max(5000) em recipientIds.
- prioridade: baixa

#### Observacoes
- none

---

### ACH-008
- titulo: Infraestrutura de eventos bem desenhada mas com handlers nao registrados
- severidade: medio
- categoria: eventos e integracao interna
- status: confirmado
- resumo: Domain events (74 tipos), outbox pattern, publisher e subscriber estao bem implementados com idempotencia. Porem, handlers de eventos nao sao registrados no bootstrap (ja reportado na auditoria de arquitetura). Do ponto de vista de APIs/integracoes, isto significa que eventos publicados nao disparam side effects.

#### Evidencia
- arquivo_ou_area: packages/shared/src/events/ (domain-event.ts com 74 tipos, event-publisher.ts, event-subscriber.ts com idempotencia, outbox-service.ts)
- detalhe: Estrutura e excelente mas incompleta operacionalmente. Publishers funcionam (salvam no outbox). Subscribers existem mas nao sao invocados.

#### Impacto
- tecnico: Comunicacao entre modulos via eventos nao funciona. Contratos de evento existem mas nao sao exercitados.
- negocio: Funcionalidades que dependem de eventos (estoque pos-venda, campaigns automaticas, notificacoes) nao operam.

#### Recomendacao
- acao_sugerida: Registrar handlers no bootstrap do worker. Implementar processors BullMQ para processar outbox.
- prioridade: media

#### Observacoes
- Overlap com auditoria de arquitetura (ACH-003/004 da run anterior). Aqui o angulo e de integracao interna entre modulos.

---

### ACH-009
- titulo: Contratos tRPC com Zod sao ricos e consistentes — ponto forte
- severidade: informativo
- categoria: contratos e consistencia
- status: confirmado
- resumo: 116 procedures em 16 routers com validacao Zod completa. Paginacao padronizada (max 100), UUIDs validados, telefones E.164, responses consistentes ({data, total} para listas). Query/mutation semantica respeitada em 100% dos casos.

#### Evidencia
- arquivo_ou_area: packages/validators/src/ (15 schema files), apps/api/src/routers/ (16 routers)
- detalhe: Zero z.any(), zero z.unknown(), zero .passthrough(). Paginacao compartilhada via common.ts. SuperJSON transformer configurado.

#### Impacto
- tecnico: Contratos fortes reduzem erros de integracao entre web e API. Zod type inference garante type safety end-to-end.
- negocio: Baixo risco de erros de contrato entre frontend e backend.

#### Recomendacao
- acao_sugerida: Manter padrao. Exportar schemas como OpenAPI para documentacao externa.
- prioridade: baixa

#### Observacoes
- none
