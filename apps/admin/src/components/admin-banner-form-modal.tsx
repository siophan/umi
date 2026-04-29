import { ConfigProvider, Form, Input, InputNumber, Modal, Select } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';
import {
  type BannerFormValues,
  POSITION_OPTIONS,
  RAW_STATUS_OPTIONS,
  TARGET_TYPE_OPTIONS,
} from '../lib/admin-banners';

interface AdminBannerFormModalProps {
  editing: boolean;
  form: ReturnType<typeof Form.useForm<BannerFormValues>>[0];
  initialValues: Partial<BannerFormValues>;
  onCancel: () => void;
  onSubmit: () => void;
  open: boolean;
  submitting: boolean;
  targetType?: BannerFormValues['targetType'];
}

export function AdminBannerFormModal({
  editing,
  form,
  initialValues,
  onCancel,
  onSubmit,
  open,
  submitting,
  targetType,
}: AdminBannerFormModalProps) {
  return (
    <Modal
      open={open}
      title={editing ? '编辑轮播' : '新增轮播'}
      okText="确定"
      cancelText="取消"
      confirmLoading={submitting}
      destroyOnClose
      onCancel={onCancel}
      onOk={onSubmit}
    >
      <ConfigProvider theme={SEARCH_THEME}>
        <Form form={form} layout="vertical" preserve={false} initialValues={initialValues}>
          <Form.Item
            label="投放位"
            name="position"
            rules={[{ required: true, message: '请选择投放位' }]}
          >
            <Select options={POSITION_OPTIONS as never} placeholder="投放位" />
          </Form.Item>
          <Form.Item
            label="轮播标题"
            name="title"
            rules={[{ required: true, message: '请输入轮播标题' }]}
          >
            <Input allowClear placeholder="轮播标题" />
          </Form.Item>
          <Form.Item label="副标题" name="subtitle">
            <Input allowClear placeholder="副标题" />
          </Form.Item>
          <Form.Item
            label="图片地址"
            name="imageUrl"
            rules={[{ required: true, message: '请输入图片地址' }]}
          >
            <Input allowClear placeholder="图片地址" />
          </Form.Item>
          <Form.Item
            label="跳转类型"
            name="targetType"
            rules={[{ required: true, message: '请选择跳转类型' }]}
          >
            <Select options={TARGET_TYPE_OPTIONS as never} placeholder="跳转类型" />
          </Form.Item>
          {targetType === 'external' || targetType === 'page' ? (
            <Form.Item
              label={targetType === 'page' ? '页面路径' : '外部链接'}
              name="actionUrl"
              rules={[
                {
                  required: true,
                  message: targetType === 'page' ? '请输入页面路径' : '请输入外部链接',
                },
              ]}
            >
              <Input
                allowClear
                placeholder={targetType === 'page' ? '/mall' : 'https://example.com'}
              />
            </Form.Item>
          ) : (
            <Form.Item
              label="跳转目标ID"
              name="targetId"
              rules={[{ required: true, message: '请输入跳转目标ID' }]}
            >
              <Input allowClear placeholder="跳转目标ID" />
            </Form.Item>
          )}
          <Form.Item label="排序" name="sort">
            <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="排序" />
          </Form.Item>
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select options={RAW_STATUS_OPTIONS as never} placeholder="状态" />
          </Form.Item>
          <Form.Item label="开始时间" name="startAt">
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item label="结束时间" name="endAt">
            <Input type="datetime-local" />
          </Form.Item>
        </Form>
      </ConfigProvider>
    </Modal>
  );
}
