export class ExpenseNotFoundError extends Error {
  constructor(id?: string) { super(id ? `Expense not found: ${id}` : 'Expense not found'); this.name = 'ExpenseNotFoundError'; }
}
