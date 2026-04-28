import type mysql from 'mysql2/promise';

import { toEntityId, type GuessCategoryItem, type GuessCategoryListResult } from '@umi/shared';

import { getDbPool } from '../../lib/db';

const GUESS_CATEGORY_BIZ_TYPE = 40;
const CATEGORY_STATUS_ACTIVE = 10;

type GuessCategoryRow = {
  id: number | string;
  name: string;
  sort: number | string | null;
  icon_class: string | null;
  theme_class: string | null;
};

export async function getGuessCategories(): Promise<GuessCategoryListResult> {
  const db = getDbPool();
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT id, name, sort, icon_class, theme_class
      FROM category
      WHERE biz_type = ? AND status = ?
      ORDER BY sort ASC, id ASC
    `,
    [GUESS_CATEGORY_BIZ_TYPE, CATEGORY_STATUS_ACTIVE],
  );

  const items: GuessCategoryItem[] = (rows as GuessCategoryRow[]).map((row) => ({
    id: toEntityId(row.id),
    name: row.name,
    sort: Number(row.sort ?? 0),
    iconClass: row.icon_class,
    themeClass: row.theme_class,
  }));

  return { items };
}
