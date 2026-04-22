import type { AdminBannerItem } from '@umi/shared';
import { Descriptions, Drawer, Image, Tag } from 'antd';

import { formatDateTime } from '../lib/format';
import { getBannerStatusColor } from '../lib/admin-banners';

interface AdminBannerDetailDrawerProps {
  onClose: () => void;
  open: boolean;
  selected: AdminBannerItem | null;
}

export function AdminBannerDetailDrawer({
  onClose,
  open,
  selected,
}: AdminBannerDetailDrawerProps) {
  return (
    <Drawer open={open} title="轮播详情" width={520} onClose={onClose}>
      {selected ? (
        <div style={{ display: 'grid', gap: 16 }}>
          {selected.imageUrl ? (
            <Image
              src={selected.imageUrl}
              width="100%"
              style={{ borderRadius: 12, objectFit: 'cover' }}
            />
          ) : null}
          <Descriptions column={1} size="small">
            <Descriptions.Item label="轮播标题">{selected.title}</Descriptions.Item>
            <Descriptions.Item label="副标题">{selected.subtitle || '-'}</Descriptions.Item>
            <Descriptions.Item label="投放位">{selected.positionLabel}</Descriptions.Item>
            <Descriptions.Item label="跳转类型">{selected.targetTypeLabel}</Descriptions.Item>
            <Descriptions.Item label="跳转目标">
              {selected.targetType === 'external' || selected.targetType === 'page'
                ? selected.actionUrl || '-'
                : selected.targetName || selected.targetId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="图片地址">{selected.imageUrl}</Descriptions.Item>
            <Descriptions.Item label="排序">{selected.sort}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getBannerStatusColor(selected.status)}>{selected.statusLabel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {selected.startAt ? formatDateTime(selected.startAt) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="结束时间">
              {selected.endAt ? formatDateTime(selected.endAt) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDateTime(selected.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatDateTime(selected.updatedAt)}</Descriptions.Item>
          </Descriptions>
        </div>
      ) : null}
    </Drawer>
  );
}
