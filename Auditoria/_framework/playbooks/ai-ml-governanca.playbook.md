---
kind: playbook
domain: ai-ml-governanca
version: "1.0"
status: ativo
---

# Playbook do Domínio: ai-ml-governanca

## Identificação
- dominio: ai-ml-governanca
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar a qualidade operacional de componentes de IA/ML em produção: governança de modelos, versionamento de prompts, qualidade dos datasets e knowledge bases, evals de saída, observabilidade de drift, guardrails de segurança comportamental, custo por inferência, supervisão humana e privacidade de dados enviados a modelos. Este domínio é complementar a `seguranca` (que cobre prompt injection adversarial e isolamento de tools); aqui o foco é **operação saudável de IA**, não defesa contra ataque.

## Aplicabilidade
Este playbook se aplica quando o sistema usar IA/ML em runtime, especialmente:
- chamadas a LLMs (OpenAI, Anthropic, Google, Mistral, modelos locais)
- agentes ou orquestradores (LangChain, LangGraph, CrewAI, custom)
- RAG, busca semântica ou embeddings
- vector databases (Pinecone, Weaviate, Qdrant, pgvector)
- fine-tuning, LoRA, ou treinamento próprio
- modelos de classificação, regressão, recomendação ou ranking em produção
- features de IA expostas ao usuário final (chatbot, summarização, geração, sugestão)
- pipelines de processamento batch que dependem de inferência

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o projeto não usa IA/ML em runtime (toda a auditoria pode virar `nao_aplicavel` com justificativa)
- IA é apenas dependência indireta (ex: search externo que retorna semantic results, sem que o projeto controle o modelo)
- não há dataset próprio, knowledge base ou prompt customizado (uso 100% out-of-the-box)
- não há fine-tuning nem treinamento sob escopo do projeto
- não há feature de IA exposta ao usuário (uso interno isolado e desacoplado)

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- inventário dos modelos e provedores em uso, com versões e política de upgrade
- avaliação da qualidade de prompts (versionamento, estrutura, testes de regressão)
- avaliação dos datasets e knowledge bases (origem, licença, freshness, contaminação)
- avaliação da estratégia de evals e métricas de qualidade
- avaliação de observabilidade e detecção de drift
- avaliação de guardrails e safety layer
- avaliação de custo por inferência, limites e detecção de runaway
- avaliação de human-in-the-loop em decisões críticas
- avaliação de privacidade de dados enviados a modelos externos
- consolidação de riscos prioritários e recomendações práticas

## Referencial Base do Playbook
Este playbook usa como baseline:
- princípios de MLOps e LLMOps modernos (governança de modelos, versionamento, observabilidade)
- abordagem prática de evals (golden set, métricas objetivas, regressão)
- princípios de Responsible AI (safety, fairness, privacy)
- padrões de custo e capacidade em IA generativa (token budget, cache, fallback)

## Escopo Padrão da Run
- inventário e governança de modelos
- versionamento e estrutura de prompts
- datasets e knowledge bases
- evals e métricas de qualidade
- drift e observabilidade
- guardrails e safety layer
- custo por inferência e limites
- human-in-the-loop e revisão
- privacidade de dados em prompts e respostas

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com qualidade operacional de IA.
- Não duplicar checks de `seguranca` F9 (prompt injection adversarial e tool isolation são auditadas lá).
- Não duplicar checks de `compliance-privacidade` quando o assunto for LGPD/GDPR strictu sensu — aqui o foco é o caminho do dado *para o modelo*, lá é o ciclo legal completo.
- Registrar achados apenas com evidência suficiente (código, métricas reais, exemplos de output).
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Quando um problema de outro domínio afetar diretamente IA (ex: secrets de API key do provedor, custo escalando em FinOps), citar como impacto e remeter ao domínio próprio.

## Fases Oficiais da Run

### Fase 1 — Inventário e Governança de Modelos
#### Objetivo
Mapear todos os modelos de IA/ML em uso pelo sistema, com provedor, versão, política de upgrade e responsável.

#### Checks Obrigatórios
- identificar todos os modelos invocados em runtime (LLMs, embeddings, classifiers, rerankers)
- identificar provedor de cada modelo (API externa, modelo local, modelo fine-tunado próprio)
- verificar **pinagem de versão** (`gpt-4-turbo-2024-04-09` em vez de `gpt-4-turbo`) — modelos não-pinados podem mudar comportamento sem aviso
- verificar política de upgrade (quando trocar versão? como testar antes? quem aprova?)
- verificar quem é dono de cada modelo (responsável técnico e de negócio)
- verificar fallback entre modelos (se modelo A falha, vai pra B?)
- verificar coexistência de versões (canary, A/B entre v1 e v2 do mesmo modelo)

#### Evidências Esperadas
- código que invoca modelos (clientes de SDK, chamadas REST)
- configuração de modelo (env vars, config files)
- documentação ou ADR de escolha de modelo
- métricas de uso por modelo

#### Possíveis Achados
- modelo invocado sem pinagem de versão
- ausência de política de upgrade
- nenhum responsável claro pelo modelo
- ausência de fallback em chamada crítica
- sem mecanismo de canary entre versões

#### Critério de Conclusão da Fase
Quando o inventário de modelos e a governança em torno deles estiverem claros.

#### Condições de Bloqueio da Fase
- impossibilidade de identificar quais modelos o sistema usa
- ausência de acesso ao código de invocação

---

### Fase 2 — Prompt Versioning e Estrutura
#### Objetivo
Avaliar a gestão de prompts: como são versionados, estruturados, testados e rolados em produção.

#### Checks Obrigatórios
- verificar se prompts vivem em código (versionados em git) ou em config externa (PromptLayer, LangSmith) ou hardcoded espalhado
- verificar **separação clara entre system prompt, user prompt e tool descriptions**
- verificar uso de templates com variáveis nomeadas em vez de string concatenation
- verificar versionamento explícito de prompt (tag, hash, número de versão)
- verificar testes de regressão de prompt (mudou o prompt → roda golden set antes de deploy)
- verificar processo de rollout (canary, gradual, ou direct push)
- verificar documentação inline do propósito de cada prompt
- verificar se há diff visível quando o prompt muda (PR review com mudança de prompt destacada)

#### Evidências Esperadas
- arquivos de prompt em diretório dedicado (`prompts/`, `templates/`)
- código de assembly de prompt
- testes de prompt em CI
- ADRs ou docs explicando os prompts

#### Possíveis Achados
- prompts hardcoded e espalhados pelo código
- system e user prompts misturados
- mudança de prompt sem teste de regressão
- ausência de versionamento explícito
- direct push em produção sem canary

#### Critério de Conclusão da Fase
Quando houver avaliação clara da maturidade de gestão de prompts.

#### Condições de Bloqueio da Fase
- ausência de acesso ao código de prompts
- impossibilidade de identificar como prompts são modificados e testados

---

### Fase 3 — Datasets e Knowledge Base
#### Objetivo
Avaliar a origem, qualidade e ciclo de vida dos dados usados para fine-tuning, RAG, embeddings ou few-shot.

#### Checks Obrigatórios
- identificar datasets em uso (treino, eval, RAG, few-shot examples)
- verificar **origem e licença** dos dados (próprios, terceiros licenciados, scraped, sintéticos)
- verificar **freshness** (data de última atualização, mecanismo de atualização)
- verificar **contaminação** (dados de teste vazando no treino, ou no contexto do RAG)
- verificar **deduplicação** e qualidade do índice vetorial
- verificar processo de inclusão/exclusão de documentos no knowledge base
- verificar se PII é redigida antes de indexar (emails, CPF, telefones em documentos do RAG)
- verificar tamanho do contexto vs janela de modelo (não estourar limite, tratar truncation com critério)
- verificar versionamento do dataset/knowledge base (snapshot reproduzível)

#### Evidências Esperadas
- pipelines de ingestão de dados
- configuração de vector DB
- documentação dos datasets
- processo de atualização (cron, trigger por evento)
- amostras de chunks indexados

#### Possíveis Achados
- dataset sem licença clara
- knowledge base nunca atualizado
- contaminação treino/teste
- duplicatas no índice causando bias
- PII indexada em texto plano
- chunking ruim quebrando contexto

#### Critério de Conclusão da Fase
Quando houver avaliação clara da qualidade dos datasets e knowledge bases.

#### Condições de Bloqueio da Fase
- impossibilidade de identificar dados de origem
- ausência de acesso ao pipeline de ingestão

---

### Fase 4 — Evals e Qualidade de Output
#### Objetivo
Avaliar a estratégia de evals: existência de testset, métricas objetivas, regressão de qualidade e golden set.

#### Checks Obrigatórios
- verificar se há **testset/golden set** com inputs e outputs esperados
- verificar **métricas em uso** (acurácia, factualidade, faithfulness, latência, tokens, custo) e adequação ao caso de uso
- verificar **automação dos evals** (rodam em CI? em batch? sob demanda?)
- verificar uso de **LLM-as-judge** quando aplicável (e calibração do juiz)
- verificar processo quando eval cai (rollback, alerta, revisão de prompt/modelo)
- verificar cobertura de casos (happy path, edge cases, adversarial, multi-língua se aplicável)
- verificar avaliação **humana** complementar (sample manual periódico)
- verificar tracking histórico de métricas (não regredir entre versões)

#### Evidências Esperadas
- diretório de testset
- código de runner de eval
- dashboard ou relatório de métricas
- política de gates de qualidade

#### Possíveis Achados
- ausência total de testset
- métricas erradas para o caso de uso (acurácia em geração livre)
- evals manuais ad-hoc, sem automação
- queda de qualidade não detectada
- sem revisão humana
- LLM-as-judge sem calibração

#### Critério de Conclusão da Fase
Quando houver avaliação clara da estratégia de evals e da qualidade de output.

#### Condições de Bloqueio da Fase
- ausência de acesso ao processo de eval (se existir)
- impossibilidade de obter amostras de output reais

---

### Fase 5 — Drift e Observabilidade de Modelo
#### Objetivo
Avaliar capacidade de detectar drift de qualidade, distribuição de input ou comportamento ao longo do tempo.

#### Checks Obrigatórios
- verificar **monitoring de qualidade em produção** (latência, taxa de refusal, tamanho de output, taxa de erro)
- verificar **detecção de drift de input** (distribuição de prompts mudou? volume mudou?)
- verificar **detecção de drift de output** (qualidade caiu sem mudança de modelo?)
- verificar **logging estruturado** de invocações (input hash, output, latência, tokens, modelo, versão de prompt)
- verificar **amostragem** de invocações para revisão (não logar tudo, mas sample suficiente)
- verificar **alertas** configurados (latência > X, erro > Y, custo runaway)
- verificar **A/B entre versões** (de prompt ou de modelo) com métricas comparáveis
- verificar capacidade de reproduzir uma invocação anterior (mesmo input + versão = mesmo path)

#### Evidências Esperadas
- logs estruturados de invocação
- dashboards de métricas (Datadog, Grafana, custom)
- configuração de alertas
- pipeline de A/B
- documentação de SLOs do modelo

#### Possíveis Achados
- ausência de logging estruturado
- nenhum alerta sobre qualidade
- drift detectado tarde (semanas depois)
- sem capacidade de reproduzir invocação
- A/B sem métricas comparáveis

#### Critério de Conclusão da Fase
Quando houver avaliação clara da capacidade de observar e detectar drift.

#### Condições de Bloqueio da Fase
- ausência de acesso a logs e métricas reais
- impossibilidade de avaliar telemetria

---

### Fase 6 — Guardrails e Safety Layer
#### Objetivo
Avaliar mecanismos de segurança comportamental: content filtering, refusal handling, output validation e fallback.

#### Checks Obrigatórios
- verificar **content filtering de input** (bloqueio de tópicos proibidos, PII em queries, conteúdo nocivo)
- verificar **content filtering de output** (toxicidade, leak de prompt, vazamento de instrução, refusal incoerente)
- verificar **output validation** (schema validation, JSON correto, structured output forçado quando aplicável)
- verificar **fallback** quando modelo erra (responder com mensagem segura, não tentar interpretar lixo)
- verificar **refusal handling** (modelo se recusou — produto trata bem, ou expõe erro técnico?)
- verificar uso de **moderation APIs** (OpenAI Moderation, Perspective, custom classifier) quando o caso de uso justifica
- verificar **guardrails frameworks** quando em uso (NeMo Guardrails, Guardrails AI, custom DSL)
- verificar limites de tamanho de input para evitar context window attacks (já em `seguranca` F9, aqui é a perspectiva operacional)

#### Evidências Esperadas
- middleware de filtering
- código de validação de output
- configuração de moderation
- handlers de refusal e fallback

#### Possíveis Achados
- nenhum filtering de input/output
- modelo retorna texto livre onde deveria ser JSON
- refusal expõe erro técnico ao usuário
- fallback ausente em chamada crítica
- ausência de moderation em UGC

#### Critério de Conclusão da Fase
Quando houver avaliação clara dos guardrails e da safety layer.

#### Condições de Bloqueio da Fase
- ausência de acesso ao código de pós-processamento de output
- impossibilidade de inspecionar payloads reais

---

### Fase 7 — Custo por Inferência e Limites
#### Objetivo
Avaliar gestão de custo de IA: token budget, cache, quota por usuário/tenant e detecção de runaway.

#### Checks Obrigatórios
- verificar **token budget por requisição** (limite máximo de input + output)
- verificar **cache de respostas** quando aplicável (mesma query → resposta cacheada)
- verificar **prompt caching** do provedor (Anthropic, Gemini) ativado quando suportado
- verificar **quota por usuário/tenant** (free tier, paid tier, anti-abuse)
- verificar **alertas de custo runaway** (gasto diário > X, requisições por usuário > Y)
- verificar uso de modelos menores quando suficiente (não invocar GPT-4 onde Haiku resolve)
- verificar **batch API** quando aplicável para reduzir custo
- verificar **streaming** quando reduz percepção de latência sem aumentar custo
- verificar tracking de custo por feature, tenant ou cohort

#### Evidências Esperadas
- middleware de rate limit por token
- configuração de cache
- dashboards de custo (provedor + interno)
- política de modelo por caso de uso

#### Possíveis Achados
- ausência de token budget — usuário pode mandar prompt de 100k tokens
- cache desabilitado onde caberia
- prompt caching nativo não aproveitado
- quota inexistente — qualquer usuário pode esgotar budget mensal
- modelo grande usado em caso simples
- sem alerta de runaway

#### Critério de Conclusão da Fase
Quando houver avaliação clara da gestão de custo e dos limites operacionais.

#### Condições de Bloqueio da Fase
- ausência de acesso a métricas de custo
- impossibilidade de identificar onde tokens são gastos

---

### Fase 8 — Human-in-the-Loop e Revisão
#### Objetivo
Avaliar pontos de supervisão humana em decisões automatizadas críticas e audit log de ações tomadas pela IA.

#### Checks Obrigatórios
- identificar decisões automatizadas críticas (financeiras, legais, de saúde, irreversíveis)
- verificar se há **confirmação humana** em decisões de alto impacto (ou justificativa explícita pra autonomia total)
- verificar **audit log** de ações tomadas por agente/IA (input, output, ferramenta usada, resultado)
- verificar capacidade de **rever e desfazer** ações automatizadas
- verificar **escalation path** quando o modelo não tem confiança (`I'm not sure` → humano)
- verificar **feedback loop** do usuário (thumbs up/down, correção, comentário) e uso desse feedback em melhoria
- verificar transparência ao usuário sobre **uso de IA** (disclaimer, marca d'água quando aplicável, opt-out)
- verificar consistência com **regulações setoriais** quando aplicável (decisão automatizada exige direito a explicação em GDPR/LGPD — referenciar `compliance-privacidade`)

#### Evidências Esperadas
- código de pontos de confirmação
- audit log de ações automatizadas
- mecanismo de feedback
- documentação de UX (onde o usuário sabe que está falando com IA)

#### Possíveis Achados
- decisão crítica totalmente automatizada sem revisão
- audit log ausente para ação de agente
- ausência de mecanismo de undo
- usuário não sabe que está falando com IA
- feedback coletado mas nunca usado

#### Critério de Conclusão da Fase
Quando houver avaliação clara da supervisão humana e da auditabilidade das ações de IA.

#### Condições de Bloqueio da Fase
- impossibilidade de mapear decisões automatizadas críticas
- ausência de acesso ao audit log

---

### Fase 9 — Privacidade e Dados em Prompts
#### Objetivo
Avaliar o caminho dos dados do usuário até o modelo: PII em prompts, política de retenção do provedor, opt-out de training e residência de dados.

#### Checks Obrigatórios
- verificar **PII enviada ao modelo** (nome, e-mail, CPF, dados de saúde, financeiro) — necessária? minimizável?
- verificar **redaction** antes de enviar ao modelo externo
- verificar **política de retenção do provedor** (OpenAI, Anthropic, Google guardam logs por quanto tempo? usam para training?)
- verificar **opt-out de training** ativado (Zero Data Retention da Anthropic, no-train da OpenAI Enterprise)
- verificar **residência de dados** quando regulada (modelo em região específica, GDPR adequacy)
- verificar separação entre **modelo externo (terceiro)** e **modelo local/próprio** quando o dado é sensível
- verificar **logging local** de prompts — podem conter PII e ficar em log para sempre
- verificar **respostas geradas** sendo persistidas e tratadas com cuidado de PII
- referência cruzada com `compliance-privacidade` para auditoria do ciclo legal completo

#### Evidências Esperadas
- código de envio ao modelo
- contrato/configuração com provedor (DPA, SOC, ZDR)
- política interna de classificação de dado
- pipeline de redaction se existir

#### Possíveis Achados
- PII enviada para modelo externo sem necessidade
- prompt logging local sem redaction
- opt-out de training não ativado
- dado sensível indo para região errada
- ausência de DPA com provedor

#### Critério de Conclusão da Fase
Quando houver avaliação clara da privacidade no caminho do dado para o modelo.

#### Condições de Bloqueio da Fase
- impossibilidade de identificar quais dados vão ao modelo
- ausência de acesso à configuração com o provedor

---

### Fase 10 — Consolidação de Achados e Preparação para Finalização
#### Objetivo
Consolidar todos os achados levantados nas fases anteriores e preparar a run para transição a `ready_for_finalize`.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades (especialmente em vetores que cruzam fases ou tocam outros domínios — segurança F9, compliance-privacidade, custos-finops)
- confirmar severidades
- separar achados de governança operacional dos achados que pertencem a outros domínios
- destacar riscos de qualidade, custo, privacidade ou supervisão
- preencher `relatorio-final.md`
- confirmar riscos prioritários e recomendações prioritárias
- atualizar `acompanhamento.md` com próximo passo coerente

#### Evidências Esperadas
- `achados.md` atualizado
- `relatorio-final.md` preenchido
- `acompanhamento.md` atualizado
- `metadata.md` pronto para transição de estado
- referências consistentes no histórico

#### Possíveis Achados
- duplicidade de achado entre fases relacionadas
- severidade inconsistente
- lacuna de evidência
- classificação inadequada de domínio
- relatório final inconsistente

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize` com todos os achados consolidados, sem duplicidade e classificados de modo coerente.

#### Condições de Bloqueio da Fase
- histórico inconsistente
- ausência de evidência mínima para consolidar
- conflito estrutural nos registros da run

---

## Ordem Oficial das Fases
1. Inventário e Governança de Modelos
2. Prompt Versioning e Estrutura
3. Datasets e Knowledge Base
4. Evals e Qualidade de Output
5. Drift e Observabilidade de Modelo
6. Guardrails e Safety Layer
7. Custo por Inferência e Limites
8. Human-in-the-Loop e Revisão
9. Privacidade e Dados em Prompts
10. Consolidação de Achados e Preparação para Finalização

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
7. Quando o sistema não usar IA/ML em runtime, todo o domínio pode ser marcado `nao_aplicavel` com justificativa única.

## Critérios para `ready_for_finalize`
A run só pode ser marcada como `ready_for_finalize` quando:
- todas as fases aplicáveis estiverem concluídas ou justificadamente marcadas como `nao_aplicavel`
- `achados.md` estiver consolidado
- `relatorio-final.md` estiver preenchido
- `acompanhamento.md` estiver atualizado
- não houver bloqueios abertos sem decisão registrada

## Situações Típicas de Bloqueio
- ausência de acesso ao código de invocação de modelo
- impossibilidade de obter logs ou amostras de output reais
- ausência de evidência mínima para inferir maturidade operacional

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita qualidade operacional de IA — governança, prompts, dados, evals, observabilidade, guardrails, custo, supervisão e privacidade.
- Ataques adversariais a IA (prompt injection, jailbreak, indirect injection, tool abuse) são auditados em `seguranca` F9, não aqui. A separação é deliberada: lá é "como atacante explora o modelo"; aqui é "como o produto de IA opera bem".
- Conformidade legal (LGPD/GDPR sobre decisão automatizada, direito a explicação, base legal para uso de dados em training) é auditada em `compliance-privacidade`. Aqui o foco é o caminho técnico do dado para o modelo.
- Custo agregado de IA na conta cloud é auditado em `custos-finops`. Aqui o foco é unitário (custo por inferência, budget por requisição, runaway por usuário).
- Quando um problema de outro domínio afetar diretamente IA, citar como impacto e remeter ao domínio próprio.
