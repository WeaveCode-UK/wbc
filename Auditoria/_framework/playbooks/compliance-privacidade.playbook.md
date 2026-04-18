---
kind: playbook
domain: compliance-privacidade
version: "1.0"
status: ativo
---

# Playbook do Domínio: compliance-privacidade

## Identificação
- dominio: compliance-privacidade
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se o sistema trata dados pessoais de forma compatível com obrigações legais e regulatórias aplicáveis (LGPD, GDPR, CCPA e equivalentes), com foco em mapeamento de PII, base legal, direitos dos titulares, retenção, transferência e resposta a incidentes.

## Aplicabilidade
Este playbook se aplica a qualquer projeto de software que colete, processe, armazene ou compartilhe dados pessoais, especialmente quando houver:
- cadastro ou autenticação de usuários
- pagamento, cobrança ou faturamento
- coleta de dados de contato (email, telefone, endereço)
- geolocalização ou dispositivo
- dados biométricos, de saúde, financeiros ou de menores
- integrações que recebem ou enviam dados pessoais
- cookies, analytics ou tracking
- hospedagem ou transferência de dados para outro país
- produto com usuários finais no Brasil ou na União Europeia

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o sistema não processa dados pessoais (apenas dados públicos, sintéticos ou de máquina)
- o projeto é uma biblioteca sem fluxo de dados pessoais próprio
- o produto não tem usuários finais humanos e não trata dados de PF por procuração
- nenhuma regulamentação aplicável cobre o contexto operacional declarado

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- mapa claro dos dados pessoais coletados, onde vivem e por onde trafegam
- avaliação da base legal declarada para cada tipo de processamento
- avaliação da gestão de consentimento quando aplicável
- avaliação dos mecanismos de atendimento aos direitos dos titulares
- avaliação da política e prática de retenção, anonimização e descarte
- avaliação de transferências internacionais e compartilhamento com terceiros
- avaliação da capacidade de detectar e notificar incidentes com dados pessoais
- consolidação dos riscos legais, regulatórios e reputacionais
- recomendações práticas priorizadas por impacto regulatório

## Referencial Base do Playbook
Este playbook usa como baseline:
- princípios de proteção de dados pessoais (finalidade, necessidade, minimização, transparência, prestação de contas)
- direitos dos titulares previstos nas principais leis (acesso, correção, portabilidade, eliminação, revogação de consentimento)
- obrigações típicas de controladores e operadores
- convenções de resposta a incidentes e notificação de breach
- avaliação objetiva do que é observável no repositório, sem substituir parecer jurídico formal

## Escopo Padrão da Run
- catálogo de dados pessoais processados
- bases legais declaradas
- fluxos de consentimento e opt-in/opt-out
- mecanismos de exercício de direitos dos titulares
- políticas de retenção, anonimização e descarte
- compartilhamento, sub-processadores e transferência internacional
- resposta a incidentes e breach notification
- documentação de apoio (política de privacidade, DPA, DPIA, RIPD)

## Regras Gerais do Domínio
- Executar somente verificações pertinentes a proteção de dados pessoais.
- Não emitir parecer jurídico formal — apenas avaliar o que é observável no repositório e no comportamento do sistema.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva baseada no escopo real do projeto.
- Registrar achados apenas com evidência concreta (arquivo, trecho, config, documentação referenciada).
- Priorizar achados com impacto regulatório explícito (multa, notificação mandatória, direito sensível) sobre preocupações cosméticas.
- Separar claramente obrigação legal mal cumprida, controle insuficiente e lacuna de documentação.
- Quando houver jurisdição aplicável declarada (LGPD, GDPR, etc.), usar essa referência para priorizar; quando não houver, usar o conjunto comum de princípios de privacidade.

## Fases Oficiais da Run

### Fase 1 — Mapeamento de Dados Pessoais e Fluxos
#### Objetivo
Identificar quais dados pessoais o sistema coleta, onde são armazenados, por onde trafegam e quem tem acesso.

#### Checks Obrigatórios
- identificar campos de modelos, schemas, migrations ou formulários que capturam dados pessoais
- classificar dados encontrados em categorias: identificação, contato, financeiro, biométrico, saúde, localização, menor de idade, outros sensíveis
- mapear armazenamento primário (banco, filas, cache, blob storage) e secundário (logs, backups, analytics)
- mapear integrações que enviam ou recebem dados pessoais (APIs externas, SDKs, webhooks, exportação)
- identificar endpoints que retornam dados pessoais e seus controles de acesso
- identificar se há processamento em larga escala, dados sensíveis ou dados de menores

#### Evidências Esperadas
- schemas de banco, migrations, modelos ORM
- DTOs, serializers, API contracts, formulários
- configuração de integrações externas que tocam PII
- amostras de payloads, logs ou mensagens de fila (sem expor dados reais)
- documentação de arquitetura de dados ou diagramas de fluxo
- referências a SDKs de analytics, CRM, payment, e-mail, SMS

#### Possíveis Achados
- PII coletado sem finalidade clara declarada
- dados sensíveis sem tratamento diferenciado do dado comum
- PII em log, cache, analytics ou backup sem controle
- campo de PII persistido sem necessidade
- integração enviando mais dados do que o necessário
- ausência de inventário ou mapa de dados mantido pelo time
- coleta oculta (ex.: geolocalização implícita, fingerprint) sem transparência

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- quais categorias de dados pessoais são processadas
- onde esses dados residem ao longo do ciclo de vida
- quem (interno e externo) tem acesso ou recebe cópia
- quais fluxos merecem análise aprofundada nas fases seguintes

#### Condições de Bloqueio da Fase
- impossibilidade de mapear o modelo de dados básico do projeto
- ausência de acesso a schemas, migrations ou código relevante
- inconsistência severa entre documentação declarada e implementação real

---

### Fase 2 — Base Legal, Consentimento e Finalidade
#### Objetivo
Avaliar se cada tipo de processamento tem base legal identificável, se o consentimento (quando aplicável) é coletado corretamente e se a finalidade é transparente ao titular.

#### Checks Obrigatórios
- verificar se há documento de política de privacidade acessível ao usuário
- verificar se a política cobre todos os tipos de dados observados na Fase 1
- verificar base legal implícita ou declarada para cada processamento (execução de contrato, consentimento, interesse legítimo, obrigação legal, proteção da vida, políticas públicas)
- verificar fluxo de captura de consentimento quando aplicável (checkbox, banner de cookies, opt-in explícito)
- verificar se o consentimento é granular (um opt-in por finalidade) ou bundle
- verificar mecanismo de revogação de consentimento
- verificar se menores de idade são tratados com controles adicionais quando aplicável
- verificar se dados sensíveis têm tratamento com base legal específica mais restrita

#### Evidências Esperadas
- arquivo de política de privacidade (markdown, PDF, página web)
- componentes de captura de consentimento (formulários, modals, cookie banners)
- configuração de analytics/tracking e flags de opt-in/opt-out
- middleware ou flag que bloqueia processamento sem consentimento
- registro de consentimento em banco (timestamp, versão da política, identificador)
- referências legais explícitas (LGPD Art. X, GDPR Art. Y) quando houver

#### Possíveis Achados
- ausência de política de privacidade visível
- política desatualizada em relação ao que o sistema coleta
- consentimento bundled (um único "aceito" cobre múltiplas finalidades)
- ausência de registro persistido do consentimento
- revogação ausente ou difícil de exercer
- dados sensíveis processados sem base legal explícita mais restrita
- analytics/tracking ativo antes do consentimento
- cookies não-essenciais sem banner ou controle

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- adequação da política de privacidade ao que o sistema realmente faz
- presença e qualidade do fluxo de consentimento quando aplicável
- transparência da finalidade de cada processamento
- principais riscos regulatórios relacionados a base legal

#### Condições de Bloqueio da Fase
- ausência de documentação mínima que permita identificar base legal
- incapacidade de observar o fluxo de consentimento no código
- conflito grave entre política declarada e implementação, sem base para conclusão

---

### Fase 3 — Direitos dos Titulares
#### Objetivo
Avaliar se o sistema oferece mecanismos técnicos para atender aos direitos dos titulares de dados pessoais.

#### Checks Obrigatórios
- verificar existência de mecanismo de acesso (titular pode ver quais dados o sistema tem sobre ele)
- verificar existência de mecanismo de correção/atualização
- verificar existência de mecanismo de eliminação (direito ao esquecimento)
- verificar existência de mecanismo de portabilidade (exportação em formato interoperável)
- verificar existência de mecanismo de revogação de consentimento efetivo
- verificar existência de mecanismo de oposição ao processamento
- verificar se existe processo humano definido para responder a solicitações que não sejam self-service
- verificar se há prazo máximo de resposta documentado
- verificar se a eliminação é cascata (remove de réplicas, backups, logs, analytics, sub-processadores)

#### Evidências Esperadas
- endpoints ou fluxos de UI para acesso/correção/eliminação/portabilidade
- rotinas administrativas ou scripts que executam eliminação completa
- documentação do processo de atendimento a titulares
- integrações com DSAR tooling (Data Subject Access Request) quando houver
- testes que cobrem o fluxo de eliminação

#### Possíveis Achados
- direito técnico não implementado (ex.: eliminação não existe)
- eliminação que é apenas soft-delete sem escopo real
- eliminação que não propaga para réplicas, backups ou integrações
- portabilidade ausente ou em formato não interoperável
- revogação de consentimento que não interrompe o processamento
- ausência de prazo de resposta documentado
- dependência exclusiva de processo manual sem SLA

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- cobertura técnica dos direitos aplicáveis
- consistência entre o que a política promete e o que o sistema permite
- riscos de não atendimento dentro do prazo legal

#### Condições de Bloqueio da Fase
- ausência de evidência para avaliar qualquer direito
- divergência grave entre política declarada e capacidade técnica sem base para conclusão

---

### Fase 4 — Retenção, Anonimização e Descarte
#### Objetivo
Avaliar se o sistema tem políticas explícitas e observáveis de retenção, anonimização e descarte de dados pessoais.

#### Checks Obrigatórios
- identificar se há política de retenção declarada por tipo de dado
- verificar se há rotinas automatizadas de descarte (cron, scheduled job, lifecycle policy)
- verificar se logs têm política de retenção definida
- verificar se backups têm política de retenção e se incluem dados pessoais
- verificar se há anonimização para fins analíticos ou de teste
- verificar se dados de usuários inativos/excluídos são removidos após prazo
- verificar se PII usado em ambientes não-produção é sintético, anonimizado ou mascarado

#### Evidências Esperadas
- documentação de política de retenção
- scripts ou cron jobs de descarte
- lifecycle policies de storage (S3, GCS, Azure Blob)
- migrations ou seeds que geram dados sintéticos
- código de anonimização/pseudonimização
- comentários ou flags em schema indicando retenção

#### Possíveis Achados
- ausência total de política de retenção
- política declarada sem implementação técnica
- retenção indefinida de PII sem justificativa
- backups com PII sem rotação ou expiração
- logs com PII persistidos além do necessário
- ambientes de staging/desenvolvimento com PII real
- ausência de anonimização para fins analíticos

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- existência e qualidade da política de retenção
- aderência entre política e implementação técnica
- riscos relacionados a dados persistidos além do necessário

#### Condições de Bloqueio da Fase
- impossibilidade de identificar o ciclo de vida dos dados no sistema
- ausência de acesso à configuração de storage/backup

---

### Fase 5 — Transferência e Compartilhamento
#### Objetivo
Avaliar as transferências internacionais e o compartilhamento de dados pessoais com terceiros (sub-processadores, parceiros, integrações).

#### Checks Obrigatórios
- identificar terceiros que recebem dados pessoais (cloud provider, analytics, e-mail, SMS, pagamento, CRM, logs externos)
- verificar se há acordo formal declarado (DPA, SCC, BCR) para cada sub-processador
- identificar se há transferência internacional de dados pessoais
- verificar se a transferência tem base legal adequada (adequação, SCC, BCR, derrogações)
- verificar se a política de privacidade lista os sub-processadores
- verificar se o fluxo de dados para cada terceiro é mínimo ao necessário
- verificar se há mecanismos para rescindir compartilhamento quando um sub-processador cessa

#### Evidências Esperadas
- lista de dependências externas que processam PII
- configurações de SDKs de terceiros
- endpoints de callback ou webhook para serviços externos
- documentação contratual referenciada (DPA, SCC)
- menções em política de privacidade
- environment variables apontando para serviços externos

#### Possíveis Achados
- sub-processadores não declarados na política
- transferência internacional sem base legal identificada
- envio de dados excessivos a terceiros (mais do que o terceiro precisa)
- integração que persiste PII em cloud estrangeira sem cobertura regulatória
- ausência de processo para ofboarding de sub-processador
- analytics que recebe PII por padrão quando poderia receber dados anonimizados

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- mapa dos terceiros que recebem dados pessoais
- riscos de transferência internacional
- qualidade do controle de dados compartilhados

#### Condições de Bloqueio da Fase
- impossibilidade de identificar os terceiros envolvidos
- ausência de documentação de integrações relevantes

---

### Fase 6 — Resposta a Incidentes com Dados Pessoais
#### Objetivo
Avaliar se o sistema tem capacidade técnica e processual para detectar, conter e notificar incidentes envolvendo dados pessoais dentro do prazo legal.

#### Checks Obrigatórios
- verificar se há plano de resposta a incidentes que cubra breach de dados pessoais
- verificar se o time consegue detectar acesso indevido a PII via logs ou monitoramento
- verificar se há capacidade de reconstruir o escopo de um incidente (quais dados, quais titulares, qual janela)
- verificar se há processo de notificação à autoridade (ANPD, DPA, equivalente) dentro do prazo legal
- verificar se há processo de notificação aos titulares quando aplicável
- verificar se incidentes anteriores têm registros ou post-mortems acessíveis

#### Evidências Esperadas
- playbook de resposta a incidentes
- configuração de audit log que permite reconstrução de incidente
- integração com SIEM, logging centralizado ou monitoramento de acesso
- template de notificação à autoridade e ao titular
- post-mortems ou registros de incidentes anteriores

#### Possíveis Achados
- ausência de plano de resposta específico para incidentes com PII
- audit log insuficiente para reconstruir incidente
- ausência de monitoramento de acesso a dados sensíveis
- ausência de processo definido de notificação
- prazo legal de notificação não documentado
- incidentes anteriores sem registro recuperável

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- capacidade técnica de detecção e reconstrução de incidente
- processo de notificação definido ou sua ausência
- principais riscos operacionais de não cumprimento de prazo

#### Condições de Bloqueio da Fase
- ausência total de documentação de resposta a incidentes
- impossibilidade de avaliar capacidade de detecção por falta de acesso a logs

---

### Fase 7 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades (priorizar achados com impacto regulatório direto)
- revisar status dos achados
- separar achados de compliance/privacidade de achados que pertençam primariamente a segurança, dados ou arquitetura
- destacar riscos que possam gerar multa, notificação mandatória ou violação de direito sensível

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes a evidências
- severidades coerentes com impacto regulatório
- diferenciação entre lacuna de documentação, controle insuficiente e não-conformidade explícita

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- achado sem evidência objetiva
- classificação inadequada entre privacidade e segurança
- risco regulatório alto subavaliado

#### Critério de Conclusão da Fase
Todos os achados relevantes da run devem estar registrados de forma consistente, sem duplicidade e classificados de modo coerente.

#### Condições de Bloqueio da Fase
- histórico inconsistente
- ausência de evidência mínima para consolidar
- conflito estrutural nos registros da run

---

### Fase 8 — Preparação para Finalização
#### Objetivo
Preparar a run para transição a `ready_for_finalize`.

#### Checks Obrigatórios
- revisar escopo executado
- revisar escopo não coberto
- preencher `relatorio-final.md`
- confirmar riscos regulatórios prioritários
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
- risco regulatório crítico mal resumido

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase
- falta de consolidação
- risco crítico sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases
1. Mapeamento de Dados Pessoais e Fluxos
2. Base Legal, Consentimento e Finalidade
3. Direitos dos Titulares
4. Retenção, Anonimização e Descarte
5. Transferência e Compartilhamento
6. Resposta a Incidentes com Dados Pessoais
7. Consolidação de Achados
8. Preparação para Finalização

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
- ausência total de documentação que permita identificar processamento de dados pessoais
- impossibilidade de mapear fluxos de dados externos
- conflito grave entre política declarada e implementação sem base suficiente para conclusão
- acesso insuficiente a logs, storage ou configurações relevantes

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita compliance e privacidade como disciplina regulatória e de governança de dados.
- Não substitui parecer jurídico formal — avalia apenas o que é observável tecnicamente no repositório e no comportamento do sistema.
- Problemas profundos de segurança, dados, arquitetura ou observabilidade devem ser tratados também em seus domínios próprios quando forem o núcleo do problema.
- Quando um problema de outro domínio tiver impacto direto em privacidade (ex.: vazamento de dados por falha de segurança), pode ser citado aqui como impacto regulatório, sem substituir a auditoria específica daquele domínio.
