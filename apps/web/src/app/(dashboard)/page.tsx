export default function DashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-heading-1 text-[var(--color-text-primary)]">{greeting}! 👋</h1>
        <p className="mt-1 text-body-small text-[var(--color-text-tertiary)]">Aqui está o resumo do seu dia</p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-[var(--color-bg-secondary)] p-4 space-y-1">
          <p className="text-caption text-[var(--color-text-tertiary)]">Vendas do mês</p>
          <p className="text-heading-2 text-[var(--color-text-primary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>100</p>
          <p className="text-caption text-[var(--color-success)]">+12% vs mês anterior</p>
        </div>
        <div className="rounded-lg bg-[var(--color-bg-secondary)] p-4 space-y-1">
          <p className="text-caption text-[var(--color-text-tertiary)]">Faturamento</p>
          <p className="text-heading-2 text-[var(--color-text-primary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>R$ 15.230</p>
        </div>
        <div className="rounded-lg bg-[var(--color-bg-secondary)] p-4 space-y-1">
          <p className="text-caption text-[var(--color-text-tertiary)]">Clientes</p>
          <p className="text-heading-2 text-[var(--color-text-primary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>50</p>
        </div>
        <div className="rounded-lg bg-[var(--color-bg-secondary)] p-4 space-y-1">
          <p className="text-caption text-[var(--color-text-tertiary)]">Lembretes</p>
          <p className="text-heading-2 text-[var(--color-text-primary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>3</p>
          <p className="text-caption text-[var(--color-warning)]">pendentes</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] p-5 space-y-4">
          <h2 className="text-heading-3 text-[var(--color-text-primary)]">Ações rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center gap-3 rounded-md bg-[var(--color-primary-surface)] p-3 text-body-small text-[var(--color-primary)] hover:bg-[var(--color-primary-surface-hover)] transition-colors">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-primary)] text-white text-lg">+</span>
              Nova venda
            </button>
            <button className="flex items-center gap-3 rounded-md bg-[var(--color-primary-surface)] p-3 text-body-small text-[var(--color-primary)] hover:bg-[var(--color-primary-surface-hover)] transition-colors">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-primary)] text-white text-lg">👤</span>
              Nova cliente
            </button>
            <button className="flex items-center gap-3 rounded-md bg-[var(--color-primary-surface)] p-3 text-body-small text-[var(--color-primary)] hover:bg-[var(--color-primary-surface-hover)] transition-colors">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-primary)] text-white text-lg">💬</span>
              Enviar mensagem
            </button>
            <button className="flex items-center gap-3 rounded-md bg-[var(--color-primary-surface)] p-3 text-body-small text-[var(--color-primary)] hover:bg-[var(--color-primary-surface-hover)] transition-colors">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-primary)] text-white text-lg">✨</span>
              Pedir pra IA
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] p-5 space-y-4">
          <h2 className="text-heading-3 text-[var(--color-text-primary)]">Hoje</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-md p-3 border-l-[3px] border-l-[var(--color-danger)]  bg-[var(--color-bg-primary)]">
              <div className="flex-1">
                <p className="text-body-small text-[var(--color-text-primary)]">Cobrança pendente</p>
                <p className="text-caption text-[var(--color-text-tertiary)]">Ana Silva — R$ 150,00</p>
              </div>
              <button className="text-caption text-[var(--color-primary)] hover:underline">Cobrar</button>
            </div>
            <div className="flex items-center gap-3 rounded-md p-3 border-l-[3px] border-l-[var(--color-warning)] bg-[var(--color-bg-primary)]">
              <div className="flex-1">
                <p className="text-body-small text-[var(--color-text-primary)]">Lembrete de reposição</p>
                <p className="text-caption text-[var(--color-text-tertiary)]">Beatriz Santos — Creme Hidratante</p>
              </div>
              <button className="text-caption text-[var(--color-primary)] hover:underline">Enviar</button>
            </div>
            <div className="flex items-center gap-3 rounded-md p-3 border-l-[3px] border-l-[var(--color-success)] bg-[var(--color-bg-primary)]">
              <div className="flex-1">
                <p className="text-body-small text-[var(--color-text-primary)]">Aniversário hoje 🎂</p>
                <p className="text-caption text-[var(--color-text-tertiary)]">Carla Oliveira</p>
              </div>
              <button className="text-caption text-[var(--color-primary)] hover:underline">Parabenizar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
