import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Typography } from 'antd';

type LoginValues = {
  username: string;
  password: string;
};

interface LoginScreenProps {
  errorMessage: string | null;
  loading: boolean;
  onSubmit: (values: LoginValues) => void | Promise<void>;
}

export function LoginScreen({
  errorMessage,
  loading,
  onSubmit,
}: LoginScreenProps) {
  return (
    <div className="login-screen">
      <Card className="login-card" bordered={false}>
        <div className="login-card__header">
          <div className="login-card__logo">UMI</div>
          <Typography.Title level={2}>管理后台登录</Typography.Title>
          <Typography.Paragraph type="secondary">
            仅后台管理员可进入。请使用后台用户名和密码登录。
          </Typography.Paragraph>
        </div>

        <Form<LoginValues>
          layout="vertical"
          onFinish={onSubmit}
          size="large"
          autoComplete="off"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入后台用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入后台用户名" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入登录密码"
            />
          </Form.Item>

          {errorMessage ? (
            <div className="login-card__error">{errorMessage}</div>
          ) : null}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button block htmlType="submit" loading={loading} type="primary">
              登录后台
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
