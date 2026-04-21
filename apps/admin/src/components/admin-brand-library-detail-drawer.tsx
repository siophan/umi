import { Descriptions, Drawer } from 'antd';

import type { AdminBrandLibraryItem } from '../lib/api/catalog';
import { formatAmount, formatDate, formatDateTime, formatNumber } from '../lib/format';

interface AdminBrandLibraryDetailDrawerProps {
  onClose: () => void;
  open: boolean;
  selected: AdminBrandLibraryItem | null;
}

export function AdminBrandLibraryDetailDrawer({
  onClose,
  open,
  selected,
}: AdminBrandLibraryDetailDrawerProps) {
  return (
    <Drawer open={open} title="品牌商品详情" width={460} onClose={onClose}>
      {selected ? (
        <Descriptions column={1} size="small">
          <Descriptions.Item label="商品">{selected.productName}</Descriptions.Item>
          <Descriptions.Item label="品牌">{selected.brandName}</Descriptions.Item>
          <Descriptions.Item label="分类">{selected.category || '-'}</Descriptions.Item>
          <Descriptions.Item label="指导价">{formatAmount(selected.guidePrice)}</Descriptions.Item>
          <Descriptions.Item label="供货价">{formatAmount(selected.supplyPrice)}</Descriptions.Item>
          <Descriptions.Item label="挂载商品">{formatNumber(selected.productCount)}</Descriptions.Item>
          <Descriptions.Item label="在售商品">{formatNumber(selected.activeProductCount)}</Descriptions.Item>
          <Descriptions.Item label="状态">{selected.status === 'active' ? '启用' : '停用'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDate(selected.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDateTime(selected.updatedAt)}</Descriptions.Item>
          <Descriptions.Item label="商品说明">{selected.description || '-'}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
}
