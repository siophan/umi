import type mysql from 'mysql2/promise';
import {
  type AdminCommunityReportListResult,
  type UpdateAdminCommunityReportPayload,
  type UpdateAdminCommunityReportResult,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { REPORT_STATUS_PENDING, REPORT_STATUS_REVIEWING, REPORT_TARGET_POST } from '../community/constants';
import {
  REPORT_ACTION_APPROVE,
  REPORT_ACTION_BAN,
  REPORT_ACTION_REJECT,
  REPORT_REASON_ABUSE,
  REPORT_REASON_EXPLICIT,
  REPORT_REASON_FALSE_INFO,
  REPORT_REASON_OTHER,
  REPORT_REASON_SPAM,
  REPORT_STATUS_REJECTED,
  REPORT_STATUS_RESOLVED,
  type AdminCommunityReportRow,
  type CommunityReportListParams,
  appendLikeFilter,
  sanitizeReport,
} from './content-shared';
import { deletePostCascade } from './content-community';

async function fetchReportById(connection: mysql.PoolConnection, reportId: string) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ri.id,
        ri.reporter_user_id,
        reporter.uid_code AS reporter_uid,
        reporter_profile.name AS reporter_name,
        ri.target_type,
        ri.target_id,
        p.title AS target_title,
        p.content AS target_content,
        p.user_id AS target_author_id,
        target_author.uid_code AS target_author_uid,
        target_author_profile.name AS target_author_name,
        ri.reason_type,
        ri.reason_detail,
        ri.status,
        ri.handle_action,
        ri.handle_note,
        ri.handled_at,
        ri.created_at
      FROM report_item ri
      INNER JOIN user reporter ON reporter.id = ri.reporter_user_id
      LEFT JOIN user_profile reporter_profile ON reporter_profile.user_id = reporter.id
      LEFT JOIN post p
        ON ri.target_type = ?
       AND p.id = ri.target_id
      LEFT JOIN user target_author
        ON target_author.id = p.user_id
      LEFT JOIN user_profile target_author_profile
        ON target_author_profile.user_id = target_author.id
      WHERE ri.id = ?
      LIMIT 1
    `,
    [REPORT_TARGET_POST, reportId],
  );

  if (rows.length === 0) {
    return null;
  }

  return sanitizeReport(rows[0] as AdminCommunityReportRow);
}

export async function getAdminCommunityReports(
  params: CommunityReportListParams,
): Promise<AdminCommunityReportListResult> {
  const db = getDbPool();
  const clauses: string[] = [];
  const values: Array<string | number> = [REPORT_TARGET_POST];

  appendLikeFilter(clauses, values, "COALESCE(reporter_profile.name, '') LIKE ?", params.reporter);

  if (params.reasonType) {
    const code =
      params.reasonType === 'spam'
        ? REPORT_REASON_SPAM
        : params.reasonType === 'explicit'
          ? REPORT_REASON_EXPLICIT
          : params.reasonType === 'abuse'
            ? REPORT_REASON_ABUSE
            : params.reasonType === 'false_info'
              ? REPORT_REASON_FALSE_INFO
              : REPORT_REASON_OTHER;
    clauses.push('ri.reason_type = ?');
    values.push(code);
  }

  appendLikeFilter(
    clauses,
    values,
    "(COALESCE(p.title, '') LIKE ? OR COALESCE(p.content, '') LIKE ?)",
    params.targetKeyword,
  );
  if (params.targetKeyword?.trim()) {
    values.push(`%${params.targetKeyword.trim()}%`);
  }

  if (params.status) {
    const statusCode =
      params.status === 'pending'
        ? REPORT_STATUS_PENDING
        : params.status === 'reviewing'
          ? REPORT_STATUS_REVIEWING
          : params.status === 'resolved'
            ? REPORT_STATUS_RESOLVED
            : REPORT_STATUS_REJECTED;
    clauses.push('ri.status = ?');
    values.push(statusCode);
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ri.id,
        ri.reporter_user_id,
        reporter.uid_code AS reporter_uid,
        reporter_profile.name AS reporter_name,
        ri.target_type,
        ri.target_id,
        p.title AS target_title,
        p.content AS target_content,
        p.user_id AS target_author_id,
        target_author.uid_code AS target_author_uid,
        target_author_profile.name AS target_author_name,
        ri.reason_type,
        ri.reason_detail,
        ri.status,
        ri.handle_action,
        ri.handle_note,
        ri.handled_at,
        ri.created_at
      FROM report_item ri
      INNER JOIN user reporter ON reporter.id = ri.reporter_user_id
      LEFT JOIN user_profile reporter_profile ON reporter_profile.user_id = reporter.id
      LEFT JOIN post p
        ON ri.target_type = ?
       AND p.id = ri.target_id
      LEFT JOIN user target_author
        ON target_author.id = p.user_id
      LEFT JOIN user_profile target_author_profile
        ON target_author_profile.user_id = target_author.id
      ${whereSql}
      ORDER BY
        CASE ri.status
          WHEN ${REPORT_STATUS_PENDING} THEN 0
          WHEN ${REPORT_STATUS_REVIEWING} THEN 1
          WHEN ${REPORT_STATUS_RESOLVED} THEN 2
          ELSE 3
        END ASC,
        ri.created_at DESC,
        ri.id DESC
    `,
    values,
  );

  const items = (rows as AdminCommunityReportRow[]).map(sanitizeReport);

  return {
    items,
    summary: {
      total: items.length,
      pending: items.filter((item) => item.status === 'pending').length,
      reviewing: items.filter((item) => item.status === 'reviewing').length,
      resolved: items.filter((item) => item.status === 'resolved').length,
      rejected: items.filter((item) => item.status === 'rejected').length,
    },
  };
}

export async function updateAdminCommunityReport(
  reportId: string,
  adminId: string,
  payload: UpdateAdminCommunityReportPayload,
): Promise<UpdateAdminCommunityReportResult> {
  const db = getDbPool();
  const connection = await db.getConnection();
  const note = payload.note?.trim() || null;

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          ri.id,
          ri.status,
          ri.target_type,
          ri.target_id,
          p.user_id AS target_author_id
        FROM report_item ri
        LEFT JOIN post p
          ON ri.target_type = ?
         AND p.id = ri.target_id
        WHERE ri.id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [REPORT_TARGET_POST, reportId],
    );

    if (rows.length === 0) {
      throw new HttpError(404, 'ADMIN_COMMUNITY_REPORT_NOT_FOUND', '举报记录不存在');
    }

    const report = rows[0] as {
      status: number | string | null;
      target_type: number | string | null;
      target_id: number | string;
      target_author_id: number | string | null;
    };

    const currentStatus = Number(report.status ?? 0);
    if (currentStatus === REPORT_STATUS_RESOLVED || currentStatus === REPORT_STATUS_REJECTED) {
      throw new HttpError(400, 'ADMIN_COMMUNITY_REPORT_ALREADY_HANDLED', '举报记录已处理');
    }

    if (payload.action === 'review') {
      await connection.execute(
        `
          UPDATE report_item
          SET status = ?, handler_id = ?, handle_action = NULL, handle_note = ?, handled_at = NULL, updated_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
        `,
        [REPORT_STATUS_REVIEWING, adminId, note, reportId],
      );
    } else if (payload.action === 'approve') {
      if (Number(report.target_type ?? 0) === REPORT_TARGET_POST) {
        await deletePostCascade(connection, String(report.target_id));
      }
      await connection.execute(
        `
          UPDATE report_item
          SET status = ?, handler_id = ?, handle_action = ?, handle_note = ?, handled_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
        `,
        [REPORT_STATUS_RESOLVED, adminId, REPORT_ACTION_APPROVE, note, reportId],
      );
    } else if (payload.action === 'reject') {
      await connection.execute(
        `
          UPDATE report_item
          SET status = ?, handler_id = ?, handle_action = ?, handle_note = ?, handled_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
        `,
        [REPORT_STATUS_REJECTED, adminId, REPORT_ACTION_REJECT, note, reportId],
      );
    } else {
      if (report.target_author_id != null) {
        await connection.execute(
          'UPDATE user SET banned = 1, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
          [report.target_author_id],
        );
      }
      if (Number(report.target_type ?? 0) === REPORT_TARGET_POST) {
        await deletePostCascade(connection, String(report.target_id));
      }
      await connection.execute(
        `
          UPDATE report_item
          SET status = ?, handler_id = ?, handle_action = ?, handle_note = ?, handled_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
        `,
        [REPORT_STATUS_RESOLVED, adminId, REPORT_ACTION_BAN, note, reportId],
      );
    }

    const item = await fetchReportById(connection, reportId);
    if (!item) {
      throw new HttpError(404, 'ADMIN_COMMUNITY_REPORT_NOT_FOUND', '举报记录不存在');
    }

    await connection.commit();
    return { item };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
