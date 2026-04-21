import { Card, Descriptions, Drawer, Tag } from 'antd';

import type { AdminCategoryItem } from '../lib/api/categories';
import { getCategoryStatusColor } from '../lib/admin-categories';
import { formatDateTime } from '../lib/format';

interface AdminCategoryDetailDrawerProps {
  onClose: () => void;
  open: boolean;
  selected: AdminCategoryItem | null;
}

export function AdminCategoryDetailDrawer({
  onClose,
  open,
  selected,
}: AdminCategoryDetailDrawerProps) {
  return (
    <Drawer open={open} title={selected?.name} width={480} onClose={onClose}>
      {selected ? (
        <div style={{ display: 'grid', gap: 16, width: '100%' }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="业务域">{selected.bizTypeLabel}</Descriptions.Item>
            <Descriptions.Item label="父分类">{selected.parentName || '-'}</Descriptions.Item>
            <Descriptions.Item label="层级">{selected.level}</Descriptions.Item>
            <Descriptions.Item label="路径">{selected.path || '-'}</Descriptions.Item>
            <Descriptions.Item label="排序">{selected.sort}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getCategoryStatusColor(selected.status)}>{selected.statusLabel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="图标地址">{selected.iconUrl || '-'}</Descriptions.Item>
            <Descriptions.Item label="说明">{selected.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDateTime(selected.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatDateTime(selected.updatedAt)}</Descriptions.Item>
          </Descriptions>

          <Card title="引用明细" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="品牌">{selected.usageBreakdown.brands}</Descriptions.Item>
              <Descriptions.Item label="品牌商品">
                {selected.usageBreakdown.brandProducts}
              </Descriptions.Item>
              <Descriptions.Item label="店铺">{selected.usageBreakdown.shops}</Descriptions.Item>
              <Descriptions.Item label="开店申请">
                {selected.usageBreakdown.shopApplies}
              </Descriptions.Item>
              <Descriptions.Item label="竞猜">{selected.usageBreakdown.guesses}</Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      ) : null}
    </Drawer>
  );
}
