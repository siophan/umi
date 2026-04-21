import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input } from 'antd';

type AdminGuessCreateOptionsCardProps = {
  bootLoading: boolean;
};

export function AdminGuessCreateOptionsCard({
  bootLoading,
}: AdminGuessCreateOptionsCardProps) {
  return (
    <Card title="竞猜选项" loading={bootLoading}>
      <Form.List name="optionTexts">
        {(fields, { add, remove }) => (
          <div style={{ display: 'grid', gap: 12 }}>
            {fields.map((field, index) => (
              <div
                key={field.key}
                style={{
                  display: 'grid',
                  gap: 12,
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  alignItems: 'start',
                }}
              >
                <Form.Item
                  {...field}
                  label={`选项 ${index + 1}`}
                  name={[field.name, 'text']}
                  rules={[{ required: true, message: '请输入选项内容' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder={`请输入选项 ${index + 1}`} maxLength={30} />
                </Form.Item>
                <Button
                  danger
                  icon={<MinusCircleOutlined />}
                  disabled={fields.length <= 2}
                  onClick={() => remove(field.name)}
                  style={{ marginTop: 30 }}
                >
                  删除
                </Button>
              </div>
            ))}
            <Button icon={<PlusOutlined />} type="dashed" onClick={() => add({ text: '' })}>
              添加选项
            </Button>
          </div>
        )}
      </Form.List>
    </Card>
  );
}
