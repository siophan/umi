import { Descriptions, Drawer, Image, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { AdminBrandLibraryItem, AdminBrandLibrarySkuItem } from '../lib/api/catalog';
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

function formatPriceRange(min: number, max: number) {
  if (min === max) {
    return formatAmount(min);
  }
  return `${formatAmount(min)} - ${formatAmount(max)}`;
}

function summarizeSpec(spec: Record<string, string>) {
  const entries = Object.entries(spec ?? {});
  if (entries.length === 0) return '默认规格';
  return entries.map(([k, v]) => `${k}：${v}`).join(' / ');
}

const SKU_COLUMNS: ColumnsType<AdminBrandLibrarySkuItem> = [
  {
    title: '规格',
    key: 'spec',
    render: (_, sku) => sku.specSummary || summarizeSpec(sku.spec),
  },
  { title: 'SKU 编码', dataIndex: 'skuCode', render: (value) => value || '-' },
  { title: '指导价', dataIndex: 'guidePrice', render: (value) => formatAmount(value) },
  {
    title: '竞猜价',
    dataIndex: 'guessPrice',
    render: (value) => (value && value > 0 ? formatAmount(value) : '-'),
  },
  { title: '库存', dataIndex: 'stock', render: (value) => formatNumber(value) },
  {
    title: '可售',
    dataIndex: 'availableStock',
    render: (value) => formatNumber(value),
  },
  {
    title: '状态',
    dataIndex: 'status',
    render: (value: AdminBrandLibrarySkuItem['status']) => (
      <Tag color={value === 'active' ? 'success' : 'default'}>
        {value === 'active' ? '启用' : '停用'}
      </Tag>
    ),
  },
];

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
            <Descriptions.Item label="指导价">
              {formatPriceRange(selected.guidePriceMin, selected.guidePriceMax)}
            </Descriptions.Item>
            <Descriptions.Item label="平台库存">
              {`${formatNumber(selected.availableTotal)} 可售 / ${formatNumber(selected.stockTotal)} 总`}
            </Descriptions.Item>
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

          <div>
            <Typography.Title level={5} style={{ marginBottom: 8 }}>
              规格 SKU 列表
            </Typography.Title>
            {selected.specDefinitions ? (
              <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
                {selected.specDefinitions
                  .map((def) => `${def.name}：${def.values.join(' / ')}`)
                  .join(' | ')}
              </Typography.Paragraph>
            ) : (
              <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
                单规格商品
              </Typography.Paragraph>
            )}
            <Table<AdminBrandLibrarySkuItem>
              size="small"
              rowKey="id"
              pagination={false}
              columns={SKU_COLUMNS}
              dataSource={selected.skus}
            />
          </div>

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
              商品相册
            </Typography.Title>
            {selected.imageList.length > 0 ? (
              <Image.PreviewGroup>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selected.imageList.map((url, index) => (
                    <Image
                      key={`${url}-${index}`}
                      src={url}
                      alt={`${selected.productName}-${index + 1}`}
                      width={88}
                      height={88}
                      style={{ borderRadius: 6, objectFit: 'cover' }}
                    />
                  ))}
                </div>
              </Image.PreviewGroup>
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
