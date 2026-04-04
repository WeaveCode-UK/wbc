# Glossário do Framework de Auditoria

## auditoria
Processo estruturado de avaliação técnica de um domínio específico do projeto.

## dominio
Área temática oficial de auditoria, como arquitetura, segurança ou performance.

## run
Instância específica de execução de uma auditoria em um domínio.

## run_id
Identificador único de uma run, baseado em data e hora.

## current
Área operacional da run atual em andamento dentro de um domínio.

## runs
Histórico das runs finalizadas de um domínio.

## runs-index
Arquivo resumido que lista as runs concluídas de um domínio.

## metadata
Arquivo que controla o estado formal da run.

## acompanhamento
Arquivo que registra histórico operacional da execução da run.

## achado
Problema, risco, inconsistência ou observação relevante identificada durante a auditoria.

## relatorio-final
Síntese consolidada da run, com resumo executivo, riscos e recomendações.

## bootstrap core
Etapa inicial que cria a estrutura-base do framework, seus templates, domínios e arquivos centrais.

## seed de playbooks
Etapa que cria e preenche o índice oficial dos playbooks e os playbooks canônicos dos domínios.

## playbook
Documento canônico que define como uma run de um domínio deve ser inicializada e executada.

## fase
Etapa lógica de uma auditoria dentro de uma run.

## lote
Subconjunto pequeno de trabalho dentro de uma fase.

## escopo
Limite do que a run pretende cobrir.

## bloqueio
Impedimento que interrompe a progressão normal da run.

## evidência
Base concreta observável no repositório que sustenta um achado.

## severidade
Classificação de gravidade de um achado.

## consolidacao
Etapa de revisão dos achados e preparação do relatório final.

## finalizacao
Etapa em que a run é arquivada no histórico e o `current/` é reinicializado.

## reauditoria
Nova run aberta futuramente para reavaliar um domínio já auditado antes.

## nao_aplicavel
Marca usada quando uma fase, verificação ou critério não faz sentido para o projeto ou domínio em questão, desde que haja justificativa.

## status-geral
Arquivo central que resume a situação do framework e dos domínios.

## maquina de estados
Conjunto de estados permitidos e transições válidas para runs do framework.
