import type { ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag } from 'antd';

import type {
  AdminBrandAuthApplyItem,
  AdminBrandAuthRecordItem,
} from './api/merchant';
import { formatDateTime } from './format';

export type BrandAuthFilters = {
  orderNo?: string;
  shopName?: string;
  brandName?: string;
  ownerName?: string;
};

export type BrandAuthStatus =
  | 'all'
  | 'pending'
  | 'authorized'
  | 'rejected'
  | 'expired'
  | 'revoked';

export type BrandAuthRow =
  | {
      sourceType: 'apply';
      id: string;
      orderNo: string;
      shopName: string;
      ownerName: string;
      ownerPhone: string | null;
      brandName: string;
      status: 'pending' | 'rejected';
      statusLabel: '待审核' | '已拒绝';
      reason: string | null;
      license: string | null;
      rejectReason: string | null;
      submittedAt: string | null;
      reviewedAt: string | null;
    }
  | {
      sourceType: 'record';
      id: string;
      orderNo: string;
      shopName: string;
      ownerName: string;
      ownerPhone: string | null;
      brandName: string;
      status: 'authorized' | 'expired' | 'revoked';
      statusLabel: '已授权' | '已过期' | '已撤销';
      subject: string;
      authTypeLabel: string;
      authScopeLabel: string;
      scopeValue: unknown;
      grantedAt: string | null;
      expireAt: string | null;
      expiredAt: string | null;
      operatorName: string | null;
    };

function mapRecordStatus(
  record: AdminBrandAuthRecordItem,
): Pick<Extract<BrandAuthRow, { sourceType: 'record' }>, 'status' | 'statusLabel'> {
  if (record.status === 'active') {
    return { status: 'authorized', statusLabel: '已授权' };
  }
  if (record.status === 'expired') {
    return { status: 'expired', statusLabel: '已过期' };
  }
  return { status: 'revoked', statusLabel: '已撤销' };
}

export function getBrandAuthStatusTagColor(status: BrandAuthRow['status']) {
  switch (status) {
    case 'authorized':
      return 'success';
    case 'rejected':
    case 'revoked':
      return 'error';
    case 'expired':
      return 'default';
    default:
      return 'warning';
  }
}

export function formatBrandAuthScopeValue(value: unknown): string {
  if (value == null) {
    return '-';
  }
  if (Array.isArray(value)) {
    const text: string = value
      .map((item) => formatBrandAuthScopeValue(item))
      .filter((item) => item !== '-')
      .join('、');
    return text.length > 0 ? text : '-';
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const nameKeys = ['name', 'title', 'label', 'subject', 'categoryName', 'productName'];
    const idKeys = ['id', 'categoryId', 'productId'];

    const firstNameKey = nameKeys.find((key) => {
      const current = record[key];
      return typeof current === 'string' && current.trim().length > 0;
    });
    const firstIdKey = idKeys.find((key) => {
      const current = record[key];
      return typeof current === 'string' || typeof current === 'number';
    });

    const nameText =
      firstNameKey && typeof record[firstNameKey] === 'string'
        ? record[firstNameKey].trim()
        : '';
    const idText =
      firstIdKey && (typeof record[firstIdKey] === 'string' || typeof record[firstIdKey] === 'number')
        ? String(record[firstIdKey]).trim()
        : '';

    if (nameText && idText) {
      return `${nameText}（ID: ${idText}）`;
    }
    if (nameText) {
      return nameText;
    }
    if (idText) {
      return `ID: ${idText}`;
    }

    const nestedKeys = ['items', 'records', 'categories', 'products', 'values', 'ids'];
    for (const key of nestedKeys) {
      if (record[key] != null) {
        const nestedText: string = formatBrandAuthScopeValue(record[key]);
        if (nestedText !== '-') {
          return nestedText;
        }
      }
    }

    const entryText: string = Object.entries(record)
      .map(([key, current]) => {
        const currentText: string = formatBrandAuthScopeValue(current);
        return currentText === '-' ? null : `${key}: ${currentText}`;
      })
      .filter((item): item is string => item != null)
      .join('；');

    if (entryText.length > 0) {
      return entryText;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return '-';
    }
  }
  const text = String(value).trim();
  return text.length > 0 ? text : '-';
}

export function mergeBrandAuthRows(
  applyItems: AdminBrandAuthApplyItem[],
  recordItems: AdminBrandAuthRecordItem[],
): BrandAuthRow[] {
  const pendingAndRejectedRows: BrandAuthRow[] = applyItems
    .filter(
      (
        item,
      ): item is AdminBrandAuthApplyItem & {
        status: 'pending' | 'rejected';
        statusLabel: '待审核' | '已拒绝';
      } => item.status === 'pending' || item.status === 'rejected',
    )
    .map((item) => ({
      sourceType: 'apply',
      id: item.id,
      orderNo: item.applyNo,
      shopName: item.shopName,
      ownerName: item.ownerName,
      ownerPhone: item.ownerPhone,
      brandName: item.brandName,
      status: item.status,
      statusLabel: item.statusLabel === '待审核' ? '待审核' : '已拒绝',
      reason: item.reason,
      license: item.license,
      rejectReason: item.rejectReason,
      submittedAt: item.submittedAt,
      reviewedAt: item.reviewedAt,
    }));

  const recordRows: BrandAuthRow[] = recordItems.map((item) => {
    const mappedStatus = mapRecordStatus(item);
    return {
      sourceType: 'record',
      id: item.id,
      orderNo: item.authNo ?? `AUTH-${item.id}`,
      shopName: item.shopName,
      ownerName: item.ownerName,
      ownerPhone: item.ownerPhone,
      brandName: item.brandName,
      status: mappedStatus.status,
      statusLabel: mappedStatus.statusLabel,
      subject: item.subject,
      authTypeLabel: item.authTypeLabel,
      authScopeLabel: item.authScopeLabel,
      scopeValue: item.scopeValue,
      grantedAt: item.grantedAt,
      expireAt: item.expireAt,
      expiredAt: item.expiredAt,
      operatorName: item.operatorName,
    };
  });

  return [...pendingAndRejectedRows, ...recordRows].sort((left, right) => {
    const leftTime =
      Date.parse(
        left.sourceType === 'apply'
          ? left.submittedAt ?? ''
          : left.grantedAt ?? left.expireAt ?? left.expiredAt ?? '',
      ) || 0;
    const rightTime =
      Date.parse(
        right.sourceType === 'apply'
          ? right.submittedAt ?? ''
          : right.grantedAt ?? right.expireAt ?? right.expiredAt ?? '',
      ) || 0;
    return rightTime - leftTime;
  });
}

export function buildBrandAuthStatusItems(rows: BrandAuthRow[]) {
  return [
    { key: 'all', label: '全部', count: rows.length },
    { key: 'pending', label: '待审核', count: rows.filter((item) => item.status === 'pending').length },
    {
      key: 'authorized',
      label: '已授权',
      count: rows.filter((item) => item.status === 'authorized').length,
    },
    {
      key: 'rejected',
      label: '已拒绝',
      count: rows.filter((item) => item.status === 'rejected').length,
    },
    { key: 'expired', label: '已过期', count: rows.filter((item) => item.status === 'expired').length },
    { key: 'revoked', label: '已撤销', count: rows.filter((item) => item.status === 'revoked').length },
  ];
}

export function filterBrandAuthRows(
  rows: BrandAuthRow[],
  filters: BrandAuthFilters,
  status: BrandAuthStatus,
) {
  return rows.filter((record) => {
    if (status !== 'all' && record.status !== status) {
      return false;
    }
    if (filters.orderNo && !record.orderNo.toLowerCase().includes(filters.orderNo.trim().toLowerCase())) {
      return false;
    }
    if (filters.shopName && !record.shopName.toLowerCase().includes(filters.shopName.trim().toLowerCase())) {
      return false;
    }
    if (
      filters.brandName &&
      !record.brandName.toLowerCase().includes(filters.brandName.trim().toLowerCase())
    ) {
      return false;
    }
    if (
      filters.ownerName &&
      !record.ownerName.toLowerCase().includes(filters.ownerName.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

export function buildBrandAuthColumns(args: {
  onApprove: (id: string) => void;
  onReject: (record: Extract<BrandAuthRow, { sourceType: 'apply' }>) => void;
  onRevoke: (record: Extract<BrandAuthRow, { sourceType: 'record' }>) => void;
  onView: (record: BrandAuthRow) => void;
  reviewingId: string | null;
}): ProColumns<BrandAuthRow>[] {
  return [
    { title: '单号', dataIndex: 'orderNo', width: 180 },
    { title: '店铺', dataIndex: 'shopName', width: 200 },
    { title: '品牌', dataIndex: 'brandName', width: 180 },
    { title: '店主', dataIndex: 'ownerName', width: 140 },
    {
      title: '联系电话',
      dataIndex: 'ownerPhone',
      width: 160,
      render: (_, record) => record.ownerPhone || '-',
    },
    {
      title: '授权类型',
      key: 'authType',
      width: 120,
      render: (_, record) => (record.sourceType === 'record' ? record.authTypeLabel : '-'),
    },
    {
      title: '授权范围',
      key: 'authScope',
      width: 140,
      render: (_, record) => (record.sourceType === 'record' ? record.authScopeLabel : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Tag color={getBrandAuthStatusTagColor(record.status)}>{record.statusLabel}</Tag>
      ),
    },
    {
      title: '时间',
      key: 'time',
      width: 180,
      render: (_, record) => {
        if (record.sourceType === 'apply') {
          return formatDateTime(record.submittedAt);
        }
        return formatDateTime(record.grantedAt ?? record.expireAt ?? record.expiredAt);
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 210,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => {
        const items = [
          <Button key="view" size="small" type="link" onClick={() => args.onView(record)}>
            查看
          </Button>,
        ];

        if (record.sourceType === 'apply' && record.status === 'pending') {
          items.push(
            <Popconfirm
              key="approve"
              okButtonProps={{ loading: args.reviewingId === record.id }}
              title="确认通过该品牌授权？"
              onConfirm={() => args.onApprove(record.id)}
            >
              <Button size="small" type="link">
                通过
              </Button>
            </Popconfirm>,
          );
          items.push(
            <Button
              key="reject"
              danger
              size="small"
              type="link"
              onClick={() => args.onReject(record)}
            >
              拒绝
            </Button>,
          );
        }

        if (record.sourceType === 'record' && record.status === 'authorized') {
          const revokeDescription =
            record.authScopeLabel === '全品牌授权'
              ? '撤销后，该店铺当前品牌在售商品会自动下架。'
              : '撤销后，仅授权范围内的在售商品会自动下架。';
          items.push(
            <Popconfirm
              key="revoke"
              description={revokeDescription}
              okButtonProps={{ loading: args.reviewingId === record.id }}
              title="确认撤销该品牌授权？"
              onConfirm={() => args.onRevoke(record)}
            >
              <Button danger size="small" type="link">
                撤销
              </Button>
            </Popconfirm>,
          );
        }

        return <div style={{ display: 'flex', gap: 8 }}>{items}</div>;
      },
    },
  ];
}
