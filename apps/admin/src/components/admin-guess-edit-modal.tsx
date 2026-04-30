import { Alert, ConfigProvider, DatePicker, Form, Input, Modal } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect } from 'react';

import { AdminOssImageUploader } from './admin-oss-image-uploader';
import { SEARCH_THEME } from './admin-list-controls';

export interface AdminGuessEditInitialValues {
  title: string;
  description: string | null;
  imageUrl: string | null;
  endTime: string | null;
}

export interface AdminGuessEditSubmitValues {
  title: string;
  description: string | null;
  imageUrl: string | null;
  endTime: string;
}

interface AdminGuessEditModalProps {
  open: boolean;
  initialValues: AdminGuessEditInitialValues | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: AdminGuessEditSubmitValues) => void;
}

type FormShape = {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  endTime: Dayjs | null;
};

export function AdminGuessEditModal({
  open,
  initialValues,
  submitting,
  onCancel,
  onSubmit,
}: AdminGuessEditModalProps) {
  const [form] = Form.useForm<FormShape>();

  useEffect(() => {
    if (!open || !initialValues) {
      return;
    }
    form.setFieldsValue({
      title: initialValues.title,
      description: initialValues.description ?? '',
      imageUrl: initialValues.imageUrl ?? '',
      endTime: initialValues.endTime ? dayjs(initialValues.endTime) : null,
    });
  }, [open, initialValues, form]);

  async function handleOk() {
    const values = await form.validateFields();
    onSubmit({
      title: values.title.trim(),
      description: values.description?.trim() || null,
      imageUrl: values.imageUrl?.trim() || null,
      endTime: values.endTime?.toISOString() ?? '',
    });
  }

  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Modal
        title="编辑竞猜"
        open={open}
        confirmLoading={submitting}
        onOk={() => void handleOk()}
        onCancel={() => {
          if (submitting) return;
          form.resetFields();
          onCancel();
        }}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
        afterClose={() => form.resetFields()}
      >
        <Alert
          type="info"
          showIcon
          message="本期仅支持编辑标题、封面、截止时间（只能延长）、描述。选项与赔率不可修改。"
          style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical">
          <Form.Item
            label="竞猜标题"
            name="title"
            rules={[
              { required: true, message: '请填写竞猜标题' },
              { whitespace: true, message: '请填写竞猜标题' },
            ]}
          >
            <Input maxLength={100} placeholder="竞猜标题" />
          </Form.Item>
          <Form.Item label="封面" name="imageUrl">
            <AdminOssImageUploader usage="guess_cover" />
          </Form.Item>
          <Form.Item
            label="截止时间"
            name="endTime"
            rules={[
              { required: true, message: '请选择截止时间' },
              {
                validator: (_, value: Dayjs | null) => {
                  if (!value || !initialValues) return Promise.resolve();
                  if (!value.isValid()) return Promise.reject(new Error('截止时间不合法'));
                  if (value.valueOf() <= Date.now()) {
                    return Promise.reject(new Error('截止时间必须晚于当前时间'));
                  }
                  if (
                    initialValues.endTime &&
                    value.valueOf() < new Date(initialValues.endTime).getTime()
                  ) {
                    return Promise.reject(new Error('截止时间只能延长'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} maxLength={500} showCount placeholder="补充说明" />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
