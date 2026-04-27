---
description: Inicia ou retoma o pipeline completo do Framework de Auditoria WeaveCode. Detecta o estado atual, executa setup (Bootstrap Core + Seed Playbooks) se necessário, depois conduz auditoria por domínio. Use em projetos onde o framework foi instalado via install.sh (auditoria-kit/ + playbook/ na raiz).
---

# audit-begin — Orquestrador do Framework de Auditoria

Você foi invocado via slash-command para iniciar ou retomar o pipeline do Framework de Auditoria WeaveCode.

## O que fazer

1. **Localize o orquestrador oficial**, verificando nesta ordem:
   - `/Auditoria/_framework/prompts/BEGIN-orquestrador-framework-auditoria-v2.md` (framework já inicializado)
   - `auditoria-kit/BEGIN-orquestrador-framework-auditoria-v2.md` (primeira execução)

2. **Leia o conteúdo completo** do arquivo encontrado.

3. **Execute fielmente as instruções do BEGIN**, como se o usuário tivesse colado o conteúdo diretamente. O BEGIN é auto-contido — não reinterprete, não resuma, não misture com outras fontes.

4. **Se nenhum dos caminhos existir**, informe ao usuário:

   ```
   Framework de Auditoria não encontrado neste projeto.

   Este projeto precisa ter o framework instalado primeiro. Rode:
     /caminho/para/Framework-Auditoria/install.sh .

   Depois invoque `/audit-begin` novamente.
   ```

## Restrições

- Não improvise etapas fora do BEGIN.
- Não carregue múltiplos prompts simultaneamente.
- Não modifique arquivos fora de `/Auditoria/` durante setup/auditoria. Apenas o Prompt 05 (correção) pode modificar código.
