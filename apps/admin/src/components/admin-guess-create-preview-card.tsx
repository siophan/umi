import type { AdminProduct } from '../lib/api/catalog';
import { formatAmount } from '../lib/format';
import { Button, Card, Space, Typography } from 'antd';

type AdminGuessCreatePreviewCardProps = {
  bootLoading: boolean;
  previewOptions: string[];
  selectedProduct: AdminProduct | null;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
};

export function AdminGuessCreatePreviewCard({
  bootLoading,
  previewOptions,
  selectedProduct,
  submitting,
  onSubmit,
  onBack,
}: AdminGuessCreatePreviewCardProps) {
  return (
    <Card title="发布预览" loading={bootLoading}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <Typography.Text type="secondary">关联商品</Typography.Text>
          <Typography.Title level={5} style={{ margin: '4px 0 0' }}>
            {selectedProduct ? selectedProduct.name : '未选择商品'}
          </Typography.Title>
          {selectedProduct ? (
            <Typography.Text type="secondary">
              {selectedProduct.brand} · {selectedProduct.shopName || '平台商品'} · 奖品价值{' '}
              {formatAmount(selectedProduct.price)}
            </Typography.Text>
          ) : null}
        </div>
        <div>
          <Typography.Text type="secondary">竞猜选项预览</Typography.Text>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {previewOptions.length > 0 ? (
              previewOptions.map((item, index) => (
                <div
                  key={`${index}-${item}`}
                  style={{
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    borderRadius: 8,
                    padding: '10px 12px',
                  }}
                >
                  <Typography.Text>
                    选项 {index + 1}：{item}
                  </Typography.Text>
                </div>
              ))
            ) : (
              <Typography.Text type="secondary">请先填写竞猜选项</Typography.Text>
            )}
          </div>
        </div>
        <Space>
          <Button type="primary" loading={submitting} onClick={onSubmit}>
            创建并发布
          </Button>
          <Button onClick={onBack}>返回竞猜列表</Button>
        </Space>
      </div>
    </Card>
  );
}
