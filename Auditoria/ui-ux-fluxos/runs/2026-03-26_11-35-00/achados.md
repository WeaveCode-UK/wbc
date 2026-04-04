# Achados da Auditoria

## Identificação
- dominio: ui-ux-fluxos
- run_id: 2026-03-26_11-35-00
- ultima_atualizacao: 2026-03-26 11:35:00

## Regras de Registro
- Registrar apenas achados reais com evidência observável.
- Não registrar opinião vaga sem base no repositório.
- Cada achado deve ter ID único dentro da run.
- Cada achado deve pertencer a uma categoria compatível com o domínio atual.
- Cada achado deve ter severidade definida.
- Se o item não for confirmado, registrar como hipótese e explicar a limitação.

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
- titulo: i18n nao integrado: translation files existem mas nao sao usados; strings hardcoded extensivas
- severidade: critico
- categoria: internacionalizacao
- status: confirmado
- resumo: packages/i18n/ possui 16 arquivos por locale (pt-BR, en) mas nenhum useTranslation() ou componente Trans e utilizado no frontend. Strings hardcoded extensivas em mobile e web.

#### Evidencia
- arquivo_ou_area: packages/i18n/ (16 arquivos por locale), apps/mobile/src/screens/ (strings hardcoded), apps/web/src/ (strings hardcoded)
- detalhe: Mobile hardcoded: "MEU DIA", "CLIENTES", "VENDAS", etc. Web hardcoded: "Criar conta", "Bom dia", labels diversos. Nenhum import de useTranslation ou Trans encontrado no frontend.

#### Impacto
- tecnico: Impossivel internacionalizar o sistema; todo o trabalho de criacao de arquivos de traducao esta inutilizado
- negocio: Viola regra explicita do projeto (zero strings hardcoded na UI); impossivel expandir para mercados de lingua inglesa

#### Recomendacao
- acao_sugerida: Integrar react-i18next no web e mobile, substituir todas as strings hardcoded por chamadas useTranslation(). Priorizar telas criticas (login, dashboard, vendas).
- prioridade: critica

#### Observacoes
- Os arquivos de traducao ja existem e estao estruturados — o trabalho restante e a integracao no frontend

---

### ACH-002
- titulo: Acessibilidade limitada: apenas 2 atributos ARIA em todo o codebase
- severidade: alto
- categoria: acessibilidade
- status: confirmado
- resumo: Apenas 2 atributos ARIA encontrados em todo o codebase: role="switch" com aria-checked em toggle-switch.tsx e aria-label em tag.tsx. Nenhum outro atributo de acessibilidade.

#### Evidencia
- arquivo_ou_area: packages/ui/src/components/toggle-switch.tsx (role="switch", aria-checked), packages/ui/src/components/tag.tsx (aria-label)
- detalhe: Nenhum aria-describedby, aria-live, aria-expanded, ou elemento dialog semantico encontrado. Sem skip links, sem landmark roles explicitos.

#### Impacto
- tecnico: Usuarios com deficiencia visual ou motora nao conseguem navegar ou operar o sistema adequadamente
- negocio: Risco de nao conformidade com WCAG 2.1 AA; potencial barreira legal em mercados regulados

#### Recomendacao
- acao_sugerida: Realizar auditoria de acessibilidade com axe-core ou Lighthouse; adicionar ARIA roles, labels e descriptions a todos os componentes interativos; usar elementos semanticos (dialog, nav, main)
- prioridade: alta

#### Observacoes
- none

---

### ACH-003
- titulo: Sem form library: validacao apenas server-side, sem feedback em tempo real
- severidade: alto
- categoria: experiencia do usuario
- status: confirmado
- resumo: Forms usam useState para controle de estado. Validacao Zod existe apenas no backend. Nenhuma form library (react-hook-form, formik) esta instalada.

#### Evidencia
- arquivo_ou_area: Forms em apps/web/src/ e apps/mobile/src/ usam useState; validacao Zod em packages/business/ (server-side apenas)
- detalhe: Sem react-hook-form ou formik em nenhum package.json. Usuario so descobre erros de validacao apos submissao do formulario.

#### Impacto
- tecnico: Sem feedback em tempo real para o usuario; sem field-level validation; sem dirty/touched state tracking
- negocio: UX degradada — abandono de formularios por frustacao; mais chamadas ao servidor para validacao

#### Recomendacao
- acao_sugerida: Instalar react-hook-form com resolver Zod; reutilizar schemas de validacao do backend no frontend para feedback em tempo real
- prioridade: alta

#### Observacoes
- Os schemas Zod do backend podem ser reutilizados no frontend com react-hook-form/resolvers

---

### ACH-004
- titulo: Botoes web xs/sm abaixo de 44px minimum touch target
- severidade: medio
- categoria: usabilidade
- status: confirmado
- resumo: Variantes xs e sm do botao web possuem altura abaixo do minimo recomendado de 44px para touch targets.

#### Evidencia
- arquivo_ou_area: packages/ui/src/components/button.tsx
- detalhe: xs tem h-[26px] (26px) e sm tem h-8 (32px). Ambos abaixo do minimo WCAG de 44x44px para touch targets.

#### Impacto
- tecnico: Dificuldade de interacao em telas touch (web mobile, tablets)
- negocio: Usuarios em dispositivos moveis podem ter dificuldade em clicar botoes pequenos

#### Recomendacao
- acao_sugerida: Aumentar altura minima das variantes xs e sm para 44px quando em viewport mobile, ou adicionar padding suficiente ao redor
- prioridade: media

#### Observacoes
- Os componentes mobile nativos (packages/ui-native) ja seguem o padrao de 44px

---

### ACH-005
- titulo: Modais usam divs ao inves de elemento semantico dialog
- severidade: medio
- categoria: acessibilidade
- status: confirmado
- resumo: Componentes de modal (confirm-modal.tsx, action-sheet.tsx) usam divs com overlay ao inves do elemento HTML dialog.

#### Evidencia
- arquivo_ou_area: packages/ui/src/components/confirm-modal.tsx, packages/ui-native/src/components/ (action-sheet equivalente)
- detalhe: Modais implementados com divs posicionados absolutamente com overlay. Sem focus trap nativo, sem escape key handling nativo.

#### Impacto
- tecnico: Sem focus trap nativo, sem escape key handling nativo, menor acessibilidade para screen readers
- negocio: Usuarios com deficiencia podem nao conseguir interagir com modais

#### Recomendacao
- acao_sugerida: Migrar para elemento dialog nativo ou usar @radix-ui/react-dialog (ja disponivel via shadcn); implementar focus trap e escape key handling
- prioridade: media

#### Observacoes
- shadcn/ui ja possui componente Dialog baseado em Radix que poderia ser reutilizado

---

### ACH-006
- titulo: @sentry/nextjs instalado mas nao configurado no web app
- severidade: medio
- categoria: monitoramento de erros
- status: confirmado
- resumo: Dependencia @sentry/nextjs esta presente em apps/web/package.json mas sem configuracao efetiva.

#### Evidencia
- arquivo_ou_area: apps/web/package.json (dependencia @sentry/nextjs), apps/web/ (sem sentry.client.config.ts, sem sentry.server.config.ts, sem sentry.edge.config.ts)
- detalhe: Dependencia instalada mas nenhum arquivo de configuracao Sentry existe. Error tracking disponivel mas completamente inativo.

#### Impacto
- tecnico: Erros no frontend nao sao capturados nem reportados; dependencia ocupa espaco no bundle sem beneficio
- negocio: Bugs em producao passam despercebidos; sem visibilidade sobre erros reais dos usuarios

#### Recomendacao
- acao_sugerida: Configurar sentry.client.config.ts e sentry.server.config.ts com DSN de projeto, ou remover a dependencia se nao for usar
- prioridade: media

#### Observacoes
- none

---

### ACH-007
- titulo: Contraste de cores nao verificado formalmente contra WCAG
- severidade: baixo
- categoria: acessibilidade
- status: confirmado
- resumo: Cores MD3 provavelmente conformes mas sem verificacao formal. Dark mode em alguns backgrounds pode falhar contraste.

#### Evidencia
- arquivo_ou_area: packages/shared/src/theme/colors.ts, packages/ui/src/theme/
- detalhe: Paleta baseada em Material Design 3 tende a ter bom contraste, mas nao ha verificacao formal com ferramentas de contraste WCAG. Combinacoes especificas em dark mode podem falhar.

#### Impacto
- tecnico: Risco baixo mas possivel falha em combinacoes especificas de cor
- negocio: Impacto visual para usuarios com baixa visao em cenarios de dark mode

#### Recomendacao
- acao_sugerida: Executar verificacao de contraste com ferramenta automatizada (axe-core, Colour Contrast Analyser) em todas as combinacoes de cores
- prioridade: baixa

#### Observacoes
- none
