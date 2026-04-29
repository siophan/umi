import { Descriptions, Drawer, Image, Tag, Typography } from 'antd';

import type { AdminBrandLibraryItem } from '../lib/api/catalog';
import { formatAmount, formatDate, formatDateTime, formatNumber } from '../lib/format';

interface AdminBrandLibraryDetailDrawerProps {
  onClose: () => void;
  open: boolean;
  selected: AdminBrandLibraryItem | null;
}

function formatFreight(freight: number | null) {
  if (freight == null) return '包邮';
  if (freight === 0) return '包邮';
  return formatAmount(freight);
}

export function AdminBrandLibraryDetailDrawer({
  onClose,
  open,
  selected,
}: AdminBrandLibraryDetailDrawerProps) {
  return (
    <Drawer open={open} title="品牌商品详情" width={600} onClose={onClose}>
      {selected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="商品">{selected.productName}</Descriptions.Item>
            <Descriptions.Item label="品牌">{selected.brandName}</Descriptions.Item>
            <Descriptions.Item label="分类">{selected.category || '-'}</Descriptions.Item>
            <Descriptions.Item label="指导价">{formatAmount(selected.guidePrice)}</Descriptions.Item>
            <Descriptions.Item label="供货价">{formatAmount(selected.supplyPrice)}</Descriptions.Item>
            <Descriptions.Item label="挂载商品">{formatNumber(selected.productCount)}</Descriptions.Item>
            <Descriptions.Item label="在售商品">{formatNumber(selected.activeProductCount)}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={selected.status === 'active' ? 'success' : 'default'}>
                {selected.status === 'active' ? '启用' : '停用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDate(selected.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatDateTime(selected.updatedAt)}</Descriptions.Item>
          </Descriptions>

          <Descriptions column={1} size="small" bordered title="发货">
            <Descriptions.Item label="运费">{formatFreight(selected.freight)}</Descriptions.Item>
            <Descriptions.Item label="发货地">{selected.shipFrom || '-'}</Descriptions.Item>
            <Descriptions.Item label="发货时效">{selected.deliveryDays || '-'}</Descriptions.Item>
          </Descriptions>

          <div>
            <Typography.Title level={5} style={{ marginBottom: 8 }}>
              封面图
            </Typography.Title>
            {selected.imageUrl ? (
              <Image
                src={selected.imageUrl}
                alt={selected.productName}
                style={{ maxWidth: 240, borderRadius: 6 }}
              />
            ) : (
              <Typography.Text type="secondary">未上传</Typography.Text>
            )}
          </div>

          <div>
            <Typography.Title level={5} style={{ marginBottom: 8 }}>
              主图视频
            </Typography.Title>
            {selected.videoUrl ? (
              <video
                src={selected.videoUrl}
                controls
                preload="metadata"
                style={{
                  width: '100%',
                  maxWidth: 360,
                  maxHeight: 240,
                  borderRadius: 6,
                  backgroundColor: '#000',
                }}
              />
            ) : (
              <Typography.Text type="secondary">未上传</Typography.Text>
            )}
          </div>

          <div>
            <Typography.Title level={5} style={{ marginBottom: 8 }}>
              商品说明
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
              {selected.description || (
                <Typography.Text type="secondary">未填写</Typography.Text>
              )}
            </Typography.Paragraph>
          </div>

          <div>
            <Typography.Title level={5} style={{ marginBottom: 8 }}>
              详情 HTML
            </Typography.Title>
            {selected.detailHtml ? (
              <div
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: 6,
                  padding: 12,
                  maxHeight: 320,
                  overflow: 'auto',
                }}
                // 内容来源是 admin 自己后台填写, 信任范围内
                dangerouslySetInnerHTML={{ __html: selected.detailHtml }}
              />
            ) : (
              <Typography.Text type="secondary">未填写</Typography.Text>
            )}
          </div>

          <div>
            <Typography.Title level={5} style={{ marginBottom: 8 }}>
              参数表
            </Typography.Title>
            {selected.specTable.length > 0 ? (
              <Descriptions column={1} size="small" bordered>
                {selected.specTable.map((row, index) => (
                  <Descriptions.Item key={`${row.key}-${index}`} label={row.key}>
                    {row.value || '-'}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            ) : (
              <Typography.Text type="secondary">未配置</Typography.Text>
            )}
          </div>

          <div>
            <Typography.Title level={5} style={{ marginBottom: 8 }}>
              包装清单
            </Typography.Title>
            {selected.packageList.length > 0 ? (
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {selected.packageList.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <Typography.Text type="secondary">未配置</Typography.Text>
            )}
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
