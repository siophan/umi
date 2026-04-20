export function buildOptions<Row, K extends keyof Row>(rows: Row[], key: K) {
  return Array.from(new Set(rows.map((item) => item[key]).filter(Boolean))).map((value) => ({
    label: String(value),
    value: String(value),
  }));
}

export function buildStatusItems<Row>(
  rows: Row[],
  getStatus: (row: Row) => string | null | undefined,
  labels?: Record<string, string>,
) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const status = getStatus(row);
    if (!status) {
      continue;
    }

    counts.set(status, (counts.get(status) ?? 0) + 1);
  }

  return [
    { key: 'all', label: '全部', count: rows.length },
    ...Array.from(counts.entries()).map(([key, count]) => ({
      key,
      label: labels?.[key] ?? key,
      count,
    })),
  ];
}
