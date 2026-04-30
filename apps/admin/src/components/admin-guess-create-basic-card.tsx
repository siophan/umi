import type { SelectProps } from 'antd';

import type { AdminProduct } from '../lib/api/catalog';
import { buildProductOptionLabel } from '../lib/admin-guess-create';
import { Card, DatePicker, Form, Input, Select } from 'antd';

type AdminGuessCreateBasicCardProps = {
  bootLoading: boolean;
  categoryOptions: Array<{ label: string; value: string }>;
  productLoading: boolean;
  productOptions: AdminProduct[];
  onProductSearch: (value: string) => void;
  onProductFocus: () => void;
};

export function AdminGuessCreateBasicCard({
  bootLoading,
  categoryOptions,
  productLoading,
  productOptions,
  onProductSearch,
  onProductFocus,
}: AdminGuessCreateBasicCardProps) {
  const productSelectOptions: SelectProps['options'] = productOptions.map((item) => ({
    label: buildProductOptionLabel(item),
    value: item.id,
  }));

  return (
    <Card title="基本信息" loading={bootLoading}>
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        <Form.Item label="竞猜标题" name="title" rules={[{ required: true, message: '请输入竞猜标题' }]}>
          <Input placeholder="例如：乐事和奥利奥谁更受欢迎？" maxLength={60} allowClear />
        </Form.Item>
        <Form.Item
          label="竞猜分类"
          name="categoryId"
          rules={[{ required: true, message: '请选择竞猜分类' }]}
        >
          <Select
            placeholder="请选择竞猜分类"
            options={categoryOptions}
            allowClear
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item
          label="关联商品"
          name="productId"
          rules={[{ required: true, message: '请选择关联商品' }]}
        >
          <Select
            placeholder="请输入商品关键词搜索"
            allowClear
            showSearch
            filterOption={false}
            loading={productLoading}
            onSearch={onProductSearch}
            onFocus={onProductFocus}
            options={productSelectOptions}
          />
        </Form.Item>
        <Form.Item
          label="截止时间"
          name="endTime"
          rules={[{ required: true, message: '请设置截止时间' }]}
        >
          <DatePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="竞猜描述" name="description" style={{ gridColumn: '1 / -1' }}>
          <Input.TextArea
            placeholder="补充竞猜规则、开奖说明或运营话术"
            rows={4}
            maxLength={200}
            showCount
          />
        </Form.Item>
      </div>
    </Card>
  );
}
