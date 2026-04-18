---
kind: playbook
domain: infraestrutura-deploy-config
version: "1.0"
status: ativo
---

# Playbook do Domínio: infraestrutura-deploy-config

## Identificação
- dominio: infraestrutura-deploy-config
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se a infraestrutura de execução, a estratégia de deploy e a gestão de configuração do sistema são suficientemente controladas, seguras e previsíveis para sustentar entrega contínua, operação consistente entre ambientes e recuperação prática em caso de falha.

## Aplicabilidade
Este playbook se aplica a qualquer projeto que rode fora do editor local, especialmente quando houver:
- deploy em servidor, cloud, PaaS, containers ou Kubernetes
- múltiplos ambientes
- CI/CD
- variáveis de ambiente ou configuração externa
- segredos
- pipelines de build
- imagens, artefatos ou pacotes publicáveis
- rollout, rollback ou release management
- backups, restore ou continuidade operacional relevante

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o projeto ainda não possui ambiente de execução real
- não existe deploy automatizado ou infraestrutura fora do contexto local
- certos mecanismos específicos, como Kubernetes manifests, não fizerem sentido para o tipo de runtime usado
- o sistema for apenas uma biblioteca sem processo próprio de entrega e execução

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- visão clara dos ambientes, artefatos e mecanismos de deploy
- avaliação da separação entre código, configuração e segredos
- avaliação do pipeline de build e entrega
- avaliação de rollout, rollback e consistência entre ambientes
- avaliação de hygiene mínima de supply chain e configuração
- consolidação dos principais riscos operacionais e recomendações práticas

## Referencial Base do Playbook
Este playbook usa como baseline:
- configuração separada do código
- segredos tratados de forma distinta de configuração comum
- pipelines e builds com rastreabilidade e controles mínimos
- deploys controlados e passíveis de observação e reversão
- ambientes com divergência reduzida e comportamento previsível
- cadeia de build e artefatos com postura mínima de integridade

## Escopo Padrão da Run
- ambientes e topologia de execução
- configuração e env vars
- segredos e dados sensíveis de runtime
- build, artefatos e imagens
- pipeline CI/CD e gates de entrega
- rollout, rollback e strategy de release
- consistência entre ambientes
- drift e mutação manual relevante
- backup, restore e recuperação quando aplicáveis
- riscos operacionais de infraestrutura e deploy

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com infraestrutura, deploy e configuração.
- Não expandir para segurança profunda, observabilidade detalhada ou confiabilidade detalhada, salvo quando houver impacto direto na entrega e operação da infraestrutura.
- Registrar achados apenas com evidência suficiente.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Priorizar problemas que tornem o deploy imprevisível, a configuração insegura ou a operação inconsistente entre ambientes.
- Diferenciar claramente:
  - limitação operacional aceitável
  - fragilidade de configuração
  - risco de deploy
  - lacuna de integridade da cadeia de entrega

## Fases Oficiais da Run

### Fase 1 — Inventário de Ambientes, Runtime e Topologia de Deploy
#### Objetivo
Identificar onde e como o sistema roda, quais ambientes existem e qual é a topologia básica de entrega e execução.

#### Checks Obrigatórios
- identificar ambientes relevantes, como local, dev, test, staging, produção ou equivalentes
- identificar runtime principal do sistema
- identificar se o deploy usa containers, VMs, PaaS, serverless, Kubernetes ou combinação equivalente
- identificar artefatos principais de execução, como imagens, pacotes, bundles ou builds
- verificar se a topologia de deploy é minimamente compreensível
- verificar se há diferença relevante e pouco controlada entre ambientes

#### Evidências Esperadas
- arquivos de deploy
- compose, manifests, helm, workflows, scripts ou configs equivalentes
- documentação de ambientes
- Dockerfiles, manifests ou configs de runtime
- artefatos de pipeline e release
- referências a staging, produção e outros ambientes

#### Possíveis Achados
- topologia de deploy pouco clara
- ambientes mal definidos
- runtime confuso
- divergência relevante entre ambientes
- artefato de execução pouco rastreável
- deploy dependente de conhecimento tácito

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- onde o sistema roda
- quais ambientes existem
- como o deploy chega ao runtime

#### Condições de Bloqueio da Fase
- impossibilidade de identificar o ambiente de execução principal
- ausência de acesso suficiente aos artefatos de deploy
- inconsistência severa que impeça mapear a topologia mínima

---

### Fase 2 — Configuração, Env Vars e Segredos
#### Objetivo
Avaliar se a configuração do sistema está separada do código e se dados sensíveis são tratados de forma distinta da configuração comum.

#### Checks Obrigatórios
- verificar se configuração de ambiente está separada do código-fonte
- verificar se env vars, config services ou mecanismos equivalentes são usados de forma consistente
- verificar se segredos não estão hardcoded em código, imagem ou config pública
- verificar se configuração não sensível e segredos estão claramente separados
- verificar se templates de config, `.env.example` ou equivalentes ajudam sem expor valor sensível
- verificar se o sistema parece portável entre ambientes sem modificação de código
- verificar se mudanças de configuração são rastreáveis e controladas

#### Evidências Esperadas
- env files de exemplo
- config loaders
- manifests, values files, configmaps, secrets ou equivalentes
- pipelines com injeção de configuração
- documentação de variáveis e segredos
- código que consome configuração

#### Possíveis Achados
- configuração embutida no código
- segredo hardcoded
- mistura de segredo com config comum
- ambiente dependente de edição manual não controlada
- divergência de config entre ambientes sem disciplina
- template de configuração expondo dado sensível
- baixa portabilidade de configuração

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- separação entre código e configuração
- tratamento de segredos
- disciplina de configuração entre ambientes

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente aos artefatos de configuração
- impossibilidade de distinguir config de segredo
- conflito severo entre configuração declarada e consumo real pelo sistema

---

### Fase 3 — Build, Artefatos, Pipeline e Integridade da Cadeia de Entrega
#### Objetivo
Avaliar se o processo de build e geração de artefatos é controlado, rastreável e com postura mínima de integridade de supply chain.

#### Checks Obrigatórios
- verificar se o build é automatizado e reproduzível em grau razoável
- verificar se há pipeline CI/CD ou mecanismo equivalente de entrega
- verificar se artefatos, imagens ou pacotes têm origem rastreável
- verificar se o processo diferencia source, build e release de forma compreensível
- verificar se há controles mínimos para evitar mutação manual arbitrária de artefatos
- verificar se dependências de build e publicação parecem tratadas com higiene mínima
- verificar se o pipeline fornece evidência suficiente de como um artefato chegou à produção

#### Evidências Esperadas
- workflows CI/CD
- scripts de build/release
- Dockerfiles, build manifests ou configs equivalentes
- registries, package publishing ou storage de artefatos
- evidência de versionamento/tagging
- logs e estágios de pipeline, quando acessíveis

#### Possíveis Achados
- build manual demais
- pipeline pouco rastreável
- artefato sem origem clara
- mutação manual frequente de release
- baixa integridade da cadeia de entrega
- imagem ou pacote sem disciplina de versionamento
- dependência crítica de build pouco controlada
- baixa confiança sobre o que foi efetivamente implantado

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- qualidade do processo de build
- rastreabilidade de artefatos
- postura mínima de integridade da supply chain

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente ao pipeline ou aos artefatos
- impossibilidade de inferir como o build acontece
- inconsistência severa entre código, build e release observados

---

### Fase 4 — Estratégia de Deploy, Rollout e Rollback
#### Objetivo
Avaliar se o deploy acontece de forma controlada, com estratégia de rollout compreensível e capacidade realista de reversão.

#### Checks Obrigatórios
- verificar se existe estratégia clara de deploy
- verificar se rollout é controlado, gradual ou minimamente observável
- verificar se há rollback ou reversão prática quando necessário
- verificar se release, versionamento e promoção entre ambientes são compreensíveis
- verificar se mudanças em runtime e configuração entram no deploy de forma coordenada
- verificar se o processo de deploy evita intervenção manual excessiva em produção
- verificar se há proteção mínima contra deploy parcial ou inconsistente

#### Evidências Esperadas
- manifests de deploy
- workflows de release
- estratégias de rollout
- tags, versões, revisões ou release notes
- comandos/scripts de rollback quando existirem
- evidências de promoção entre ambientes

#### Possíveis Achados
- deploy imprevisível
- rollout não controlado
- rollback inexistente ou impraticável
- release sem versionamento claro
- deploy manual demais
- mudança de config fora do ciclo de entrega
- risco de estado inconsistente entre revisões

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- controle do processo de deploy
- capacidade de rollout seguro
- capacidade prática de rollback ou reversão

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente ao mecanismo de deploy
- impossibilidade de inferir como releases são promovidas
- conflito severo entre documentação, pipeline e runtime observado

---

### Fase 5 — Consistência entre Ambientes, Drift, Backup e Recuperação Operacional
#### Objetivo
Avaliar se os ambientes se mantêm coerentes, se mudanças manuais geram drift relevante e se existem bases mínimas para continuidade operacional via backup, restore ou mecanismos equivalentes quando aplicáveis.

#### Checks Obrigatórios
- verificar se ambientes importantes mantêm divergência controlada
- verificar se há sinais de drift por mudanças manuais frequentes
- verificar se infraestrutura e configuração são declarativas em grau razoável
- verificar se stores e componentes críticos possuem estratégia mínima de backup e restore quando aplicável
- verificar se o sistema consegue ser reconstruído ou reprovisionado com previsibilidade mínima
- verificar se quotas, limites, permissões ou bindings críticos são conhecidos e tratáveis
- verificar se a operação depende de correções manuais opacas para manter o sistema no ar

#### Evidências Esperadas
- manifests, templates ou IaC quando existirem
- documentação operacional
- scripts de provisionamento
- políticas ou sinais de backup/restore
- evidência de reconstrução de ambiente
- diferenças visíveis entre dev/staging/prod ou equivalentes

#### Possíveis Achados
- drift relevante entre ambientes
- ambiente não reprodutível
- dependência excessiva de ajuste manual
- backup/restore ausente onde seria esperado
- recuperação operacional fraca
- configuração crítica não declarativa
- comportamento imprevisível entre ambientes

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- consistência entre ambientes
- risco de drift
- prontidão mínima para recuperação operacional

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente aos artefatos de ambiente
- impossibilidade de inferir diferença entre ambientes
- conflito severo entre estado declarado e operação real observável

---

### Fase 6 — Pipeline Security e Integridade do Processo de Entrega
#### Objetivo
Avaliar se o próprio pipeline de CI/CD e o processo de entrega estão protegidos contra comprometimento que permita inserir código malicioso nos artefatos publicados.

#### Checks Obrigatórios
- verificar se há branch protection ativa na branch principal (required reviews, required status checks, dismiss stale reviews)
- verificar se commits na branch principal são assinados quando possível (GPG, SSH signed commits)
- verificar onde os workflows rodam (GitHub-hosted, self-hosted runners) e se runners são isolados entre jobs
- verificar se segredos do CI seguem princípio de menor privilégio (workflows não-publicadores não têm acesso a token de publicação)
- verificar se pull requests de fork podem acessar segredos (devem ser bloqueados)
- verificar se workflows disparados externamente têm validação adequada (workflow_run, repository_dispatch)
- verificar se actions externas estão pinadas por commit SHA (não por tag móvel)
- verificar se build produz artefato com metadata de proveniência (commit, builder, timestamp)
- verificar se há signed releases/artifacts quando aplicável (Sigstore, GPG, in-toto, SLSA)

#### Evidências Esperadas
- configuração de branch protection no repo (rulesets, required checks)
- arquivos em .github/workflows com pinagem de actions
- configuração de segredos (environments, workflow permissions)
- Dockerfile e script de build com metadata embutida
- SBOM ou provenance attestation publicada junto com releases

#### Possíveis Achados
- main/master sem branch protection
- commits em main sem assinatura
- action externa em @main ou @v1 (tag móvel) em vez de SHA fixo
- workflow com `permissions: write-all` onde não precisa
- segredos de publicação acessíveis a workflows em PR de fork
- runner self-hosted sem isolamento entre jobs
- release sem provenance
- ausência de validação de workflow_run antes de executar ação privilegiada

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- postura de segurança do pipeline
- riscos de comprometimento do processo de entrega
- qualidade dos controles de acesso a segredos e artefatos publicados

#### Condições de Bloqueio da Fase
- ausência de acesso à configuração do CI/CD
- impossibilidade de avaliar segurança de runners self-hosted quando estão fora do escopo do repositório

---

### Fase 7 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades
- revisar status dos achados
- separar achados realmente de infraestrutura/deploy/config de achados cujo núcleo pertença a outro domínio
- destacar riscos prioritários de configuração, deploy e integridade de entrega

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes no histórico
- severidades coerentes
- distinção entre limitação operacional, fragilidade de deploy e lacuna estrutural de configuração

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- lacuna de evidência
- classificação inadequada de domínio
- risco crítico de entrega subavaliado

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
- risco crítico de deploy ou configuração mal resumido

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase
- falta de consolidação
- risco crítico sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases
1. Inventário de Ambientes, Runtime e Topologia de Deploy
2. Configuração, Env Vars e Segredos
3. Build, Artefatos, Pipeline e Integridade da Cadeia de Entrega
4. Estratégia de Deploy, Rollout e Rollback
5. Consistência entre Ambientes, Drift, Backup e Recuperação Operacional
6. Pipeline Security e Integridade do Processo de Entrega
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
- ausência de estrutura mínima para verificar o domínio
- inconsistência estrutural da run
- evidência insuficiente para avançar com segurança
- conflito grave entre configuração, pipeline e comportamento real de entrega

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita infraestrutura de execução, deploy e configuração como disciplina operacional de entrega.
- Problemas profundos de segurança, observabilidade, confiabilidade, dados ou arquitetura devem ser tratados também em seus domínios próprios quando forem o núcleo do problema.
- Quando um problema de outro domínio afetar diretamente previsibilidade de deploy, gestão de configuração ou integridade de entrega, ele pode ser citado aqui como impacto de infraestrutura/deploy/config, sem substituir a auditoria específica daquele domínio.
