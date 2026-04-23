// ACH-008 testes-qualidade: helper genérico para mockar um repository
// respeitando a interface, sem precisar de jest-mock-extended. Em
// Fase 7 testes passam a consumir isto em vez de objetos literais.

export function makeMockRepo<T extends object>(overrides: Partial<T> = {}): T {
  // Em Fase 7, trocar o Proxy por vi.fn() por método real via
  // vi.mocked(). Stub mínimo enquanto a suíte de testes não existe.
  const handler: ProxyHandler<object> = {
    get(_target, prop: string) {
      if (prop in overrides) {
        return (overrides as Record<string, unknown>)[prop];
      }
      return (..._args: unknown[]) => {
        throw new Error(
          `makeMockRepo: método '${prop}' chamado sem override — configure em Fase 7 com vi.fn()`,
        );
      };
    },
  };
  return new Proxy({}, handler) as T;
}
