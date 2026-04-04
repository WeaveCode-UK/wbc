export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

type PrismaModel = {
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
  count: (args: Record<string, unknown>) => Promise<number>;
};

export async function paginatedQuery<T>(
  model: PrismaModel,
  where: Record<string, unknown>,
  pagination: PaginationParams,
  orderBy: Record<string, string> = { createdAt: 'desc' },
  include?: Record<string, unknown>,
): Promise<PaginatedResult<T>> {
  const findManyArgs: Record<string, unknown> = {
    where,
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit,
    orderBy,
  };
  if (include) findManyArgs.include = include;

  const [data, total] = await Promise.all([
    model.findMany(findManyArgs),
    model.count({ where }),
  ]);

  return { data: data as T[], total };
}

export function buildTenantWhere(
  tenantId: string,
  filters: Record<string, unknown>,
): Record<string, unknown> {
  const where: Record<string, unknown> = { tenantId };
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      where[key] = value;
    }
  }
  return where;
}
