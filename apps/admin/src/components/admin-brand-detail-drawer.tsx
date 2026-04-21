import { Descriptions, Drawer, Tag } from 'antd';

import type { AdminBrandItem } from '../lib/api/merchant';
import { formatDate, formatNumber } from '../lib/format';

interface AdminBrandDetailDrawerProps {
  onClose: () => void;
  open: boolean;
  selected: AdminBrandItem | null;
}

export function AdminBrandDetailDrawer({
  onClose,
  open,
  selected,
}: AdminBrandDetailDrawerProps) {
  return (
    <Drawer open={open} title="品牌管理" width={460} onClose={onClose}>
      {selected ? (
        <Descriptions column={1} size="small">
          <Descriptions.Item label="品牌">{selected.name}</Descriptions.Item>
          <Descriptions.Item label="类目">{selected.category || '-'}</Descriptions.Item>
          <Descriptions.Item label="合作店铺">{formatNumber(selected.shopCount)}</Descriptions.Item>
          <Descriptions.Item label="标准商品">{formatNumber(selected.goodsCount)}</Descriptions.Item>
          <Descriptions.Item label="联系人">{selected.contactName || '-'}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{selected.contactPhone || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={selected.status === 'active' ? 'success' : 'default'}>
              {selected.statusLabel}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDate(selected.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="品牌说明">{selected.description || '-'}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
}
