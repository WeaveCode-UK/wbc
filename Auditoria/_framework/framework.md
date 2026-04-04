# Framework de Auditoria de Projetos

## Objetivo
Este framework existe para permitir auditorias técnicas incrementais, rastreáveis e reutilizáveis em projetos de software de qualquer porte.

Seu propósito é:
- reduzir improviso durante auditorias
- evitar perda de contexto entre execuções
- permitir uso por modelos menores ou com contexto limitado
- registrar histórico técnico de forma persistida no próprio repositório
- apoiar a detecção de falhas de arquitetura, segurança, qualidade e operação

## Princípios do Framework
1. O estado oficial da auditoria deve estar em arquivos, não na memória da conversa.
2. Auditorias devem ser executadas em fases pequenas e controladas dentro de um domínio por vez.
3. Cada domínio de auditoria possui histórico próprio.
4. O framework deve funcionar em projetos novos, legados ou parcialmente incompletos.
5. O framework deve ser reutilizável entre diferentes projetos de software.
6. O framework possui duas etapas de setup:
   - Bootstrap Core
   - Seed de Playbooks

## Estrutura Oficial
A estrutura oficial do framework está sob `/Auditoria`.

### Núcleo do framework
- `/Auditoria/_framework`

### Domínios oficiais
- `/Auditoria/arquitetura`
- `/Auditoria/codigo-manutenibilidade`
- `/Auditoria/seguranca`
- `/Auditoria/apis-integracoes`
- `/Auditoria/dados-persistencia`
- `/Auditoria/performance-escalabilidade`
- `/Auditoria/confiabilidade-resiliencia`
- `/Auditoria/observabilidade-operacao`
- `/Auditoria/testes-qualidade`
- `/Auditoria/ui-ux-fluxos`
- `/Auditoria/infraestrutura-deploy-config`

### Playbooks
Os playbooks oficiais ficam em:
- `/Auditoria/_framework/playbooks/`

Eles são semeados na etapa 01B e definem:
- objetivo padrão da run
- escopo padrão da run
- fases internas do domínio
- checks obrigatórios
- critérios de bloqueio
- critérios para `ready_for_finalize`

## Estrutura por Domínio
Cada domínio contém:
- `runs-index.md`
- `current/`
- `runs/`

### `current/`
Área da run atual em andamento.

Contém:
- `metadata.md`
- `acompanhamento.md`
- `achados.md`
- `relatorio-final.md`

### `runs/`
Histórico das runs finalizadas.

### `runs-index.md`
Índice resumido das runs históricas do domínio.

## Ciclo Oficial
1. Bootstrap Core
2. Seed de Playbooks
3. Início de nova run
4. Execução da run orientada por playbook
5. Finalização e arquivamento da run

## Arquivos Centrais do Núcleo
- `framework.md`
- `convencoes.md`
- `lifecycle.md`
- `domains.md`
- `execution-rules.md`
- `state-machine.md`
- `glossario.md`
- `checklist-global.md`
- `status-geral.md`
- `bootstrap-report.md`
- `playbook-seed-report.md`

## Templates
Os templates oficiais ficam em:
- `/Auditoria/_framework/templates/`

Eles definem a estrutura inicial obrigatória dos arquivos operacionais.

## Regra de Autoridade
Em caso de conflito entre execução improvisada e documentação do framework, a documentação oficial do framework prevalece.

## Resultado Esperado
O framework deve permitir auditorias repetíveis, comparáveis ao longo do tempo e resistentes à perda de contexto.
