# Playbook do Domínio: apis-integracoes

## Identificação
- dominio: apis-integracoes
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se as APIs e integrações do sistema possuem contratos claros, semântica consistente, tratamento adequado de erros, robustez operacional e superfície de integração suficientemente segura e previsível para consumidores internos e externos.

## Aplicabilidade
Este playbook se aplica a qualquer projeto que exponha ou consuma interfaces de integração, especialmente quando houver:
- APIs HTTP/REST
- webhooks
- callbacks
- integrações com terceiros
- filas, eventos ou mensageria
- SDKs ou clients internos relevantes
- comunicação entre serviços
- contratos públicos ou semipúblicos

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o sistema não expõe nem consome integrações relevantes
- o projeto é apenas uma biblioteca local sem interface de integração operacional
- não existem webhooks, eventos, filas ou contratos externos no escopo
- certos mecanismos, como versionamento ou idempotência, não fizerem sentido para a natureza da interface auditada

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- visão clara das interfaces de integração do sistema
- avaliação da qualidade dos contratos e da semântica das APIs
- avaliação de tratamento de erros, paginação, versionamento e compatibilidade
- avaliação de webhooks, callbacks e integrações externas
- avaliação de robustez operacional, idempotência e tolerância a falhas nas integrações
- consolidação dos principais riscos e recomendações práticas

## Referencial Base do Playbook
Este playbook usa como baseline:
- semântica HTTP coerente com métodos, recursos e códigos de status
- contratos de API descritos e compreensíveis
- APIs seguras contra riscos típicos de superfície e autorização
- operações não idempotentes tratadas de forma robusta quando necessário
- integrações externas e webhooks com comportamento previsível e rastreável

## Escopo Padrão da Run
- inventário de APIs e integrações
- contratos, schemas e documentação
- semântica de métodos e status codes
- consistência de request/response
- paginação, filtros, ordenação e versionamento quando aplicáveis
- erros e envelopes de erro
- idempotência, retries e duplicidade
- webhooks, callbacks e eventos
- robustez de integrações externas
- riscos típicos de segurança de API e exposição indevida

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com APIs e integrações.
- Não expandir para segurança profunda, arquitetura macro ou observabilidade detalhada, salvo quando houver impacto direto na qualidade da integração.
- Registrar achados apenas com evidência suficiente.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Priorizar quebras de contrato, semântica inconsistente, integrações frágeis e riscos claros de consumo incorreto.
- Diferenciar claramente:
  - inconsistência de contrato
  - fragilidade operacional
  - risco de segurança de API
  - hipótese de integração mal definida

## Fases Oficiais da Run

### Fase 1 — Inventário de Interfaces, Contratos e Escopo de Integração
#### Objetivo
Identificar quais interfaces de integração o sistema expõe ou consome e localizar os artefatos que definem seus contratos.

#### Checks Obrigatórios
- identificar endpoints, rotas, handlers, controllers ou gateways expostos
- identificar integrações externas consumidas pelo sistema
- identificar webhooks, callbacks, eventos, filas ou canais equivalentes
- localizar documentação de API, schemas, OpenAPI, clients, SDKs ou contratos equivalentes
- verificar se a superfície de integração está minimamente inventariada
- verificar se existem contratos implícitos demais, dependentes apenas do código

#### Evidências Esperadas
- arquivos de rotas e handlers
- documentação OpenAPI ou equivalente
- clients HTTP/RPC
- contratos de evento, webhook ou fila
- README técnico ou docs de integração
- gateways, adapters ou middleware de integração

#### Possíveis Achados
- API sem contrato documentado
- integração externa relevante sem documentação mínima
- webhook implícito demais
- superfície de integração pouco clara
- evento ou fila sem contrato compreensível
- dependência de integração acoplada a comportamento implícito do código

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- quais interfaces existem
- quais contratos as descrevem
- quais integrações merecem análise aprofundada nas fases seguintes

#### Condições de Bloqueio da Fase
- impossibilidade de identificar as interfaces reais do sistema
- ausência de acesso suficiente aos artefatos que expõem ou consomem integrações
- inconsistência severa que impeça mapear a superfície de integração

---

### Fase 2 — Semântica HTTP, Contratos e Consistência de Request/Response
#### Objetivo
Avaliar se as APIs HTTP usam semântica consistente e se seus contratos de entrada e saída são claros, estáveis e previsíveis para consumidores.

#### Checks Obrigatórios
- verificar uso coerente de métodos HTTP para o comportamento declarado
- verificar coerência de status codes com o resultado real das operações
- verificar se requests e responses seguem contratos claros e consistentes
- verificar clareza de schemas, campos obrigatórios, opcionais e formatos
- verificar se recursos, nomes, paths e operações seguem convenção compreensível
- verificar se envelopes, paginação, filtros, ordenação e parâmetros são consistentes quando aplicáveis
- verificar se a API parece previsível para um consumidor sem depender de leitura profunda do código

#### Evidências Esperadas
- OpenAPI/specs/schemas
- exemplos de request/response
- controllers, serializers, DTOs, validators e mappers
- documentação de parâmetros e respostas
- exemplos de paginação, filtro e sort
- uso real de status codes e payloads

#### Possíveis Achados
- método HTTP semanticamente inadequado
- status code inconsistente
- contrato ambíguo
- schema incompleto ou implícito
- response shape inconsistente
- paginação ou filtros incoerentes
- naming de recurso confuso
- dependência excessiva de comportamento não documentado

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- qualidade semântica da API
- previsibilidade dos contratos
- consistência geral de request/response

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente aos contratos ou handlers relevantes
- impossibilidade de relacionar documentação e implementação
- inconsistência severa entre spec e comportamento do código

---

### Fase 3 — Erros, Idempotência, Versionamento e Compatibilidade
#### Objetivo
Avaliar se a interface trata falhas de forma previsível, suporta operações sensíveis com robustez razoável e preserva compatibilidade ao longo do tempo.

#### Checks Obrigatórios
- verificar se erros possuem estrutura minimamente consistente
- verificar se mensagens de erro ajudam consumo, troubleshooting e automação
- verificar se operações não idempotentes sensíveis possuem estratégia de idempotência quando necessário
- verificar risco de duplicidade em retries, timeouts ou falhas de rede
- verificar se há versionamento, compatibilidade ou estratégia de evolução da interface quando aplicável
- verificar tratamento de breaking changes ou drift de contrato
- verificar se consumidores internos/externos seriam afetados por mudanças aparentemente simples

#### Evidências Esperadas
- envelopes de erro
- status codes de erro
- retries, deduplication, idempotency keys ou mecanismos equivalentes
- changelogs, versionamento em path/header/schema quando existirem
- documentação de compatibilidade
- logs ou código de tratamento de falhas em integração

#### Possíveis Achados
- erro inconsistente ou pouco utilizável
- duplicidade por falta de idempotência
- retry inseguro
- breaking change sem estratégia
- interface evoluindo sem compatibilidade clara
- consumidor exposto a drift de contrato
- mudança simples com alto risco de quebra de integração

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- previsibilidade de erro
- robustez para retries/reexecução
- maturidade de compatibilidade e evolução da interface

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente às camadas de erro ou retry
- impossibilidade de inferir política de compatibilidade
- conflito grave entre contrato, operação e estratégia de reexecução

---

### Fase 4 — Webhooks, Callbacks, Eventos e Integrações Externas
#### Objetivo
Avaliar se interfaces reativas e integrações externas são robustas, seguras e operacionalmente tratáveis.

#### Checks Obrigatórios
- verificar se webhooks ou callbacks têm contrato claro
- verificar se origem, autenticação, assinatura ou validação mínima existem quando aplicável
- verificar se há proteção contra replay, duplicidade e reentrega quando necessário
- verificar se eventos, filas ou mensagens possuem contrato compreensível e tratamento de erro adequado
- verificar se integrações externas possuem timeout, retry, idempotência ou fallback coerentes quando aplicável
- verificar se há acoplamento excessivo a comportamento frágil de terceiros
- verificar se falhas em integração externa produzem comportamento previsível no sistema

#### Evidências Esperadas
- handlers de webhook
- validação de assinatura ou headers relevantes
- contratos de evento ou payload
- consumers/producers
- clients externos
- configuração de retries, timeout e deduplication
- documentação de integração e callbacks

#### Possíveis Achados
- webhook sem validação mínima
- callback frágil
- replay ou duplicidade não tratados
- evento sem contrato claro
- integração externa sem timeout
- dependência frágil de terceiro
- falha externa mal tratada
- acoplamento alto a detalhe operacional externo

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- robustez de webhooks/eventos
- fragilidade de integrações externas
- riscos principais de quebra ou comportamento imprevisível

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente aos fluxos de integração
- impossibilidade de identificar contratos ou garantias mínimas
- conflito severo entre documentação e implementação da integração

---

### Fase 5 — Segurança de API, Exposição Indevida e Consumo de Recursos
#### Objetivo
Avaliar riscos típicos de segurança e operação associados à superfície de API, especialmente autorização, exposição de dados e consumo indevido de recursos.

#### Checks Obrigatórios
- verificar se a API demonstra sinais de controle de acesso por recurso/objeto quando necessário
- verificar se propriedades sensíveis parecem filtradas adequadamente
- verificar risco de exposição excessiva de dados
- verificar se há proteção razoável contra consumo irrestrito de recursos quando aplicável
- verificar se integrações consumidas pelo sistema são tratadas de forma segura e defensiva
- verificar se endpoints internos, administrativos ou menos visíveis possuem proteção consistente
- verificar se a API parece desenhada para consumo seguro, sem pressupostos frágeis

#### Evidências Esperadas
- guards, policies, checks de recurso
- serializers, field filtering, DTOs
- limites, paginação, rate control ou mecanismos equivalentes
- clients externos e validações de resposta
- rotas internas/admin
- exemplos de payloads e responses

#### Possíveis Achados
- broken object-level authorization provável
- exposição excessiva de propriedades
- API consumindo integração externa de forma insegura
- consumo irrestrito de recurso
- endpoint administrativo exposto de forma inconsistente
- contrato que induz consumidor a comportamento arriscado
- validação insuficiente de resposta externa

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- principais riscos de segurança de API e integração
- exposição indevida de dados ou recursos
- fragilidades relevantes no consumo e exposição de interfaces

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente às rotas e controles relevantes
- impossibilidade de relacionar dados expostos a regras de autorização
- inconsistência severa que impeça inferir postura mínima de segurança da API

---

### Fase 6 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades
- revisar status dos achados
- separar achados realmente de APIs/integrações de achados cujo núcleo pertença a outro domínio
- destacar quebras de contrato, fragilidades operacionais e riscos de consumo prioritários

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes no histórico
- severidades coerentes
- distinção entre inconsistência de contrato, fragilidade operacional e risco de segurança

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- lacuna de evidência
- classificação inadequada de domínio
- risco de integração crítica subavaliado

#### Critério de Conclusão da Fase
Todos os achados relevantes da run devem estar registrados de forma consistente, sem duplicidade e classificados de modo coerente.

#### Condições de Bloqueio da Fase
- histórico inconsistente
- ausência de evidência mínima para consolidar
- conflito estrutural nos registros da run

---

### Fase 7 — Preparação para Finalização
#### Objetivo
Preparar a run para transição a `ready_for_finalize`.

#### Checks Obrigatórios
- revisar escopo executado
- revisar escopo não coberto
- preencher `relatorio-final.md`
- confirmar riscos prioritários
- confirmar recomendações prioritárias
- verificar se existem bloqueios abertos
- confirmar avaliação geral do domínio

#### Evidências Esperadas
- `relatorio-final.md` preenchido
- `acompanhamento.md` com próximo passo coerente
- `metadata.md` pronto para transição de estado

#### Possíveis Achados
- run incompleta
- recomendação insuficiente
- bloqueio em aberto
- relatório final inconsistente
- quebra crítica de contrato mal resumida

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase
- falta de consolidação
- risco crítico sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases
1. Inventário de Interfaces, Contratos e Escopo de Integração
2. Semântica HTTP, Contratos e Consistência de Request/Response
3. Erros, Idempotência, Versionamento e Compatibilidade
4. Webhooks, Callbacks, Eventos e Integrações Externas
5. Segurança de API, Exposição Indevida e Consumo de Recursos
6. Consolidação de Achados
7. Preparação para Finalização

## Regras de Execução da Run Baseada neste Playbook
1. O Prompt 02 deve usar este playbook para inicializar:
   - objetivo da run
   - escopo da run
   - fases planejadas
   - fase atual inicial
   - próximo passo obrigatório
2. O Prompt 03 deve executar as fases deste playbook na ordem oficial.
3. Não pular fase sem justificativa explícita.
4. Se uma fase não for aplicável, registrar `nao_aplicavel` com justificativa.
5. Se houver impedimento real, mudar a run para `blocked`.
6. Se todas as fases aplicáveis forem concluídas, preparar transição para `ready_for_finalize`.

## Critérios para `ready_for_finalize`
A run só pode ser marcada como `ready_for_finalize` quando:
- todas as fases aplicáveis estiverem concluídas ou justificadamente marcadas como `nao_aplicavel`
- `achados.md` estiver consolidado
- `relatorio-final.md` estiver preenchido
- `acompanhamento.md` estiver atualizado
- não houver bloqueios abertos sem decisão registrada

## Situações Típicas de Bloqueio
- ausência de estrutura mínima para verificar o domínio
- inconsistência estrutural da run
- evidência insuficiente para avançar com segurança
- conflito grave entre contrato, documentação e comportamento real da integração

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita interfaces de integração, contratos e robustez operacional da superfície de API.
- Problemas profundos de segurança, arquitetura, observabilidade, performance ou infraestrutura devem ser tratados também em seus domínios próprios quando forem o núcleo do problema.
- Quando um problema de outro domínio afetar diretamente previsibilidade, consumo ou robustez da integração, ele pode ser citado aqui como impacto em APIs/integrações, sem substituir a auditoria específica daquele domínio.
