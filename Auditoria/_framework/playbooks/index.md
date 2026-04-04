# Índice Oficial de Playbooks do Framework de Auditoria

## Objetivo
Este índice lista os playbooks oficiais do framework e define qual playbook deve ser usado ao iniciar uma run de auditoria por domínio.

## Regra de Seleção
O Prompt 02 — Iniciar Run deve:
1. apresentar os domínios oficiais disponíveis;
2. receber a escolha de um único domínio;
3. validar se o domínio escolhido existe neste índice;
4. localizar o playbook correspondente;
5. inicializar a run com base nesse playbook.

## Domínios Oficiais e Playbooks

1. arquitetura
   - arquivo: `/Auditoria/_framework/playbooks/arquitetura.playbook.md`
   - foco: aderência entre arquitetura declarada e implementada

2. codigo-manutenibilidade
   - arquivo: `/Auditoria/_framework/playbooks/codigo-manutenibilidade.playbook.md`
   - foco: saúde evolutiva do código

3. seguranca
   - arquivo: `/Auditoria/_framework/playbooks/seguranca.playbook.md`
   - foco: riscos de exploração, exposição e proteção

4. apis-integracoes
   - arquivo: `/Auditoria/_framework/playbooks/apis-integracoes.playbook.md`
   - foco: contratos, rotas, webhooks e robustez de integração

5. dados-persistencia
   - arquivo: `/Auditoria/_framework/playbooks/dados-persistencia.playbook.md`
   - foco: modelagem, integridade e operação da camada de dados

6. performance-escalabilidade
   - arquivo: `/Auditoria/_framework/playbooks/performance-escalabilidade.playbook.md`
   - foco: eficiência, gargalos e capacidade de crescimento

7. confiabilidade-resiliencia
   - arquivo: `/Auditoria/_framework/playbooks/confiabilidade-resiliencia.playbook.md`
   - foco: comportamento sob falha, recuperação e robustez operacional

8. observabilidade-operacao
   - arquivo: `/Auditoria/_framework/playbooks/observabilidade-operacao.playbook.md`
   - foco: logs, métricas, traces, health checks e diagnóstico

9. testes-qualidade
   - arquivo: `/Auditoria/_framework/playbooks/testes-qualidade.playbook.md`
   - foco: prevenção de regressão e robustez da validação automatizada

10. ui-ux-fluxos
    - arquivo: `/Auditoria/_framework/playbooks/ui-ux-fluxos.playbook.md`
    - foco: integridade funcional da interface e qualidade de fluxo

11. infraestrutura-deploy-config
    - arquivo: `/Auditoria/_framework/playbooks/infraestrutura-deploy-config.playbook.md`
    - foco: prontidão operacional, configuração e entrega

## Regras Operacionais dos Playbooks
- Cada run deve usar apenas um playbook por vez.
- O playbook selecionado define objetivo, escopo, fases internas, checks obrigatórios, critérios de bloqueio e critérios de `ready_for_finalize`.
- O Prompt 03 — Executar Run deve executar somente o playbook da run atualmente aberta.
- O Prompt 04 — Finalizar Run deve fechar somente a run atualmente aberta.

## Resultado Esperado
O framework deve permitir que o usuário:
1. escolha um domínio;
2. abra a run com base no playbook desse domínio;
3. execute a auditoria desse domínio;
4. finalize e arquive essa run;
5. depois inicie outra run, de outro domínio, se desejar.
