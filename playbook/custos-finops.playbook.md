---
kind: playbook
domain: custos-finops
version: "1.0"
status: ativo
---

# Playbook do Domínio: custos-finops

## Identificação

- dominio: custos-finops
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio

Avaliar a eficiência financeira da operação de software — mapear onde o custo vai, identificar desperdícios, over-provisioning, recursos ociosos, oportunidades de otimização e a qualidade da observabilidade de custo, para que decisões de arquitetura levem em conta custo como uma dimensão de projeto.

## Aplicabilidade

Este playbook se aplica a qualquer projeto que incorra em custos de infraestrutura operacional, especialmente quando houver:

- hospedagem em cloud pública (AWS, GCP, Azure, Oracle, Hetzner, DO, Linode, etc.)
- bancos de dados gerenciados
- serviços de cache, fila, storage pagos
- chamadas a APIs externas pagas (LLMs, pagamento, SMS, e-mail, maps)
- consumo de CDN, egress, DNS premium
- serviços de observabilidade pagos (Datadog, NewRelic, Sentry, etc.)
- custos indiretos significativos (build minutes, CI/CD, SaaS dev tools)

## Não Aplicabilidade

Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:

- o projeto é inteiramente local/on-premise sem custo variável relevante
- o orçamento total é tão baixo que otimização não altera decisões
- custos estão fora do escopo operacional do time auditado
- o projeto é biblioteca/ferramenta sem operação própria

## Resultado Esperado

Uma run bem executada deste domínio deve produzir:

- mapa dos principais centros de custo identificáveis no código/config
- avaliação de over-provisioning e ociosidade aparente
- avaliação de anti-padrões arquiteturais que geram custo desproporcional
- avaliação de modelagem de custo por feature/tenant quando aplicável
- avaliação da observabilidade de custo (alertas, orçamento, tags)
- identificação de oportunidades de otimização concretas
- consolidação dos principais desperdícios e trade-offs
- recomendações práticas priorizadas por retorno estimado

## Referencial Base do Playbook

Este playbook usa como baseline:

- princípios gerais de FinOps (visibilidade, otimização, accountability)
- anti-padrões clássicos de custo em cloud (recursos órfãos, egress desnecessário, over-provisioning, sem auto-scaling)
- boas práticas de tagging, allocation e chargeback
- avaliação objetiva do que é observável no repositório e em configs de infra

## Escopo Padrão da Run

- inventário de recursos cloud declarados (IaC, dashboards, manifests)
- utilização e sizing aparente
- padrões arquiteturais com impacto de custo
- tagging e allocation
- observabilidade de custo e alertas
- oportunidades óbvias de otimização (reservas, savings plans, spot, egress)
- custo por unidade de negócio (feature, tenant, request) quando aplicável

## Regras Gerais do Domínio

- Executar somente verificações pertinentes à dimensão financeira da operação.
- Registrar achados apenas com evidência concreta (código, config, IaC, integração explícita).
- Não inventar números de custo — trabalhar com proporção, tendência e risco identificável.
- Priorizar achados com impacto recorrente mensal significativo sobre economias marginais.
- Separar claramente desperdício inequívoco (recurso órfão) de escolha arquitetural com trade-off.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Não exigir acesso a faturas ou dashboards da cloud — operar no que é observável no repositório e inferir o resto.

## Fases Oficiais da Run

### Fase 1 — Inventário de Recursos e Centros de Custo

#### Objetivo

Catalogar os principais recursos e serviços que geram custo identificável a partir do código, IaC e configurações.

#### Checks Obrigatórios

- identificar IaC declarado (Terraform, Pulumi, CloudFormation, CDK, Bicep)
- identificar recursos cloud declarados: compute (EC2, GCE, VMs), serverless (Lambda, Cloud Functions), containers (ECS, GKE, AKS)
- identificar serviços gerenciados: RDS, Aurora, Cloud SQL, DynamoDB, Firestore, Redis, Elasticache, etc.
- identificar storage: S3, GCS, Azure Blob, volumes EBS/PD
- identificar rede: NAT Gateways, Load Balancers, CDN, VPN, transit gateways
- identificar observabilidade paga: APM, logs centralizados, métricas
- identificar APIs externas pagas (LLM, pagamento, SMS, e-mail, maps, geo)
- identificar custos de build: CI/CD minutes, artifact storage, imagens de container

#### Evidências Esperadas

- arquivos `*.tf`, `*.tfvars`, `main.bicep`, `cdk.json`, `pulumi.yaml`
- docker-compose.yml, k8s manifests, helm charts
- configuração de provedores (providers.tf, provider blocks)
- .github/workflows com runners pagos ou minutes intensivos
- referências a SDKs de serviços externos pagos
- envs com endpoints e credenciais de serviços pagos

#### Possíveis Achados

- ausência de IaC (configuração implícita via console)
- recursos declarados sem ownership identificável
- múltiplas camadas redundantes (ex.: CDN + load balancer + reverse proxy próprio)
- serviços pagos para carga que não justifica (APM enterprise em projeto com 100 usuários)
- custos de API externa dominantes sem estratégia de cache ou rate limit
- minutes de CI consumidos por workflows ineficientes

#### Critério de Conclusão da Fase

A fase pode ser concluída quando estiver claro:

- quais são os principais centros de custo inferíveis
- qual é a arquitetura de custo dominante (compute-heavy, storage-heavy, egress-heavy, API-heavy)
- que áreas merecem análise aprofundada nas fases seguintes

#### Condições de Bloqueio da Fase

- ausência total de IaC ou configuração acessível
- impossibilidade de inferir o que o projeto efetivamente usa em produção

---

### Fase 2 — Utilização, Sizing e Ociosidade

#### Objetivo

Avaliar se os recursos estão dimensionados adequadamente ao uso real e identificar ociosidade aparente.

#### Checks Obrigatórios

- verificar se há auto-scaling configurado em workloads variáveis
- verificar min/max de auto-scaling e se min está agressivo (mantém capacidade ociosa desnecessária)
- verificar sizing de instâncias vs workload conhecido (web server em instância enterprise sem justificativa)
- identificar recursos em environments secundários (staging, dev) com sizing de produção
- identificar recursos em regiões não usadas
- identificar bancos de dados gerenciados em tier maior do que o necessário
- identificar storage com lifecycle policy ausente (buckets crescendo indefinidamente)
- identificar snapshots/backups retidos além da política declarada
- identificar ambientes de desenvolvimento "on 24/7" sem schedule de desligamento

#### Evidências Esperadas

- configuração de autoscaling groups, HPA (k8s), scale policies
- tamanho de instâncias declaradas em IaC
- lifecycle policies de storage
- configuração de backup retention
- cron/schedule de power on/off em ambientes

#### Possíveis Achados

- auto-scaling min muito alto (capacidade ociosa permanente)
- instâncias over-provisioned sem métrica que justifique
- staging/dev 24/7 sem necessidade
- bucket crescendo sem expiração
- snapshots retidos indefinidamente
- read replicas inativas
- cluster k8s com nós ociosos fora do horário comercial

#### Critério de Conclusão da Fase

A fase pode ser concluída quando houver avaliação clara sobre:

- aderência entre sizing e carga esperada
- presença ou ausência de mecanismos de elasticidade
- principais fontes de ociosidade identificáveis

#### Condições de Bloqueio da Fase

- ausência de visibilidade mínima sobre sizing atual
- impossibilidade de inferir padrão de uso sem métricas básicas

---

### Fase 3 — Arquitetura e Anti-padrões de Custo

#### Objetivo

Avaliar escolhas arquiteturais que têm impacto significativo no custo total.

#### Checks Obrigatórios

- identificar padrões de egress de rede (tráfego cross-AZ, cross-region, para internet)
- verificar uso de CDN para conteúdo estático
- verificar uso de cache em camadas (app, DB, HTTP) onde faria sentido
- identificar N+1 queries ou amplificação de chamadas externas
- identificar uso de LLMs ou APIs pagas sem cache ou batching
- identificar polling excessivo quando eventos/webhooks seriam mais baratos
- identificar logs excessivos enviados para observabilidade paga
- identificar queries caras repetidas sem materialização
- identificar processamento síncrono de trabalho que poderia ser assíncrono/batch

#### Evidências Esperadas

- configuração de rede (VPCs, subnets, peering, egress)
- camadas de cache em código (Redis, Memcached, in-memory)
- ORMs e queries SQL
- chamadas a APIs externas pagas
- padrões de polling vs event-driven
- filtros e sampling de logs

#### Possíveis Achados

- ausência de CDN para assets estáticos (egress alto)
- tráfego cross-AZ sem necessidade (split de subnets mal feito)
- N+1 queries em endpoint crítico
- chamadas a LLM sem cache, sem batching, sem context compaction
- logging verboso em produção ingerido por APM pago
- polling a cada poucos segundos quando webhook existe
- cluster Kubernetes com muitos pods pequenos vs menos pods maiores

#### Critério de Conclusão da Fase

A fase pode ser concluída quando houver avaliação clara sobre:

- anti-padrões arquiteturais de custo presentes
- oportunidades estruturais de economia
- trade-offs entre eficiência de custo e outras dimensões (latência, complexidade)

#### Condições de Bloqueio da Fase

- impossibilidade de avaliar fluxos arquiteturais principais
- ausência de código suficiente para avaliar padrões de uso

---

### Fase 4 — Observabilidade de Custo e Alocação

#### Objetivo

Avaliar a visibilidade de custo disponível ao time e a capacidade de alocar custo a unidades de negócio.

#### Checks Obrigatórios

- verificar se há política de tagging documentada (ambiente, projeto, owner, feature, cost-center)
- verificar se tags estão aplicadas consistentemente em IaC
- verificar se há budgets/alertas de custo configurados
- verificar se há dashboards de custo disponíveis ao time
- verificar se há alocação de custo por feature, produto ou tenant quando aplicável
- verificar se o custo de features/tenants críticos é monitorado como KPI

#### Evidências Esperadas

- tags em recursos IaC
- configuração de billing alerts, cost budgets
- dashboards declarados em IaC (CloudWatch dashboards, Grafana JSON)
- documentação de política de tagging
- convenções declaradas no README ou docs

#### Possíveis Achados

- ausência de tagging consistente
- recursos sem owner identificável
- ausência de budget/alert (sem visibilidade de picos)
- custo por tenant desconhecido (impossível identificar usuários não-rentáveis)
- dashboard de custo restrito a finance, invisível ao time técnico
- ausência de mecanismo para atribuir custo a feature

#### Critério de Conclusão da Fase

A fase pode ser concluída quando houver avaliação clara sobre:

- qualidade da observabilidade de custo
- capacidade de alocação e accountability
- riscos de surpresa em fatura

#### Condições de Bloqueio da Fase

- ausência de qualquer visibilidade de custo
- impossibilidade de avaliar tagging sem IaC

---

### Fase 5 — Otimização Comercial e Eficiência de Contrato

#### Objetivo

Avaliar oportunidades de otimização via instrumentos comerciais (reservas, savings plans, spot, committed use) e escolhas de serviços alternativos.

#### Checks Obrigatórios

- identificar workloads estáveis que poderiam estar em reserved instances ou savings plans mas estão on-demand
- identificar workloads tolerantes a interrupção que poderiam estar em spot/preemptible
- identificar serviços onde há alternativa mais barata com paridade suficiente (ex.: queue service premium vs SQS/Pub-Sub básico)
- verificar se há uso de free tier para ambientes não-produção quando disponível
- identificar APIs externas com tier comercial mais barato por volume não utilizado
- identificar duplicação de serviços entre times ou produtos

#### Evidências Esperadas

- tipos de instância declarados
- serviços gerenciados em uso
- documentação de escolhas de contrato quando houver
- comparações com alternativas declaradas no código/arquitetura

#### Possíveis Achados

- workloads estáveis 100% on-demand sem plano
- ausência total de spot para jobs tolerantes
- serviço premium usado em ambiente dev
- duplicação de observabilidade (APM + logs estruturados + métricas em 3 vendors diferentes)
- API externa em tier pay-as-you-go quando o volume justificaria plano mensal

#### Critério de Conclusão da Fase

A fase pode ser concluída quando houver avaliação clara sobre:

- oportunidades comerciais identificáveis
- presença ou ausência de estratégia de commitment
- risco de overpaying por falta de planejamento

#### Condições de Bloqueio da Fase

- impossibilidade de identificar carga estável vs variável
- ausência de informação sobre volume atual de uso

---

### Fase 6 — Consolidação de Achados

#### Objetivo

Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios

- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades (priorizar achados com impacto recorrente mensal significativo)
- revisar status dos achados
- separar achados de custo de achados primariamente de arquitetura, performance ou infra
- estimar impacto relativo quando possível (alto/médio/baixo) sem inventar números absolutos

#### Evidências Esperadas

- `achados.md` atualizado
- referências consistentes a configs e código
- severidades coerentes com recorrência e magnitude

#### Possíveis Achados

- duplicidade de achado
- severidade inconsistente
- classificação inadequada (arquitetura puro vs custo com causa arquitetural)
- oportunidade de alto impacto subavaliada

#### Critério de Conclusão da Fase

Todos os achados relevantes da run devem estar registrados de forma consistente, sem duplicidade e classificados de modo coerente.

#### Condições de Bloqueio da Fase

- histórico inconsistente
- ausência de evidência mínima para consolidar

---

### Fase 7 — Preparação para Finalização

#### Objetivo

Preparar a run para transição a `ready_for_finalize`.

#### Checks Obrigatórios

- revisar escopo executado
- revisar escopo não coberto
- preencher `relatorio-final.md`
- confirmar oportunidades prioritárias
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
- oportunidade de alto retorno mal resumida

#### Critério de Conclusão da Fase

A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase

- falta de consolidação
- bloqueio crítico sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases

1. Inventário de Recursos e Centros de Custo
2. Utilização, Sizing e Ociosidade
3. Arquitetura e Anti-padrões de Custo
4. Observabilidade de Custo e Alocação
5. Otimização Comercial e Eficiência de Contrato
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

- ausência total de IaC ou declaração de infraestrutura
- impossibilidade de inferir padrão de uso atual
- ausência de contexto mínimo sobre modelo de negócio para avaliar proporção de custo

## Estrutura de Saída Esperada da Run

Ao final da execução deste playbook, a run deve ter:

- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook

- Este playbook audita custo operacional como disciplina financeira de engenharia.
- Não substitui análise de fatura pelo time de finance — foca no que é observável e acionável pelo time técnico.
- Quando um problema de arquitetura ou performance for a causa-raiz de custo, o achado fica aqui com referência cruzada ao domínio primário.
- Este playbook não exige acesso a dashboards da cloud — opera por inferência a partir do que está no repositório e de conhecimento geral dos padrões de custo.
