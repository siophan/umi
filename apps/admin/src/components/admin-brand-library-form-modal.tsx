import { Button, ConfigProvider, Divider, Form, Input, InputNumber, Modal, Select, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

import { AdminOssImageGalleryUploader } from './admin-oss-image-gallery-uploader';
import { AdminOssImageUploader } from './admin-oss-image-uploader';
import { AdminOssVideoUploader } from './admin-oss-video-uploader';
import { SEARCH_THEME } from './admin-list-controls';
import type { BrandProductFormValues } from '../lib/admin-brand-library';

interface AdminBrandLibraryFormModalProps {
  brandIdOptions: Array<{ label: string; value: string }>;
  categoryIdOptions: Array<{ label: string; value: string }>;
  editing: boolean;
  form: ReturnType<typeof Form.useForm<BrandProductFormValues>>[0];
  /** 控制每次打开时 Form 用什么初值; 切 record / 新增/编辑 切换都靠它驱动 remount */
  initialValues: Partial<BrandProductFormValues>;
  onCancel: () => void;
  onSubmit: () => void;
  open: boolean;
  submitting: boolean;
}

export function AdminBrandLibraryFormModal({
  brandIdOptions,
  categoryIdOptions,
  editing,
  form,
  initialValues,
  onCancel,
  onSubmit,
  open,
  submitting,
}: AdminBrandLibraryFormModalProps) {
  return (
    <Modal
      open={open}
      width={720}
      title={editing ? '编辑品牌商品' : '新增品牌商品'}
      okText="确定"
      cancelText="取消"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={onSubmit}
      destroyOnClose
    >
      <ConfigProvider theme={SEARCH_THEME}>
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={initialValues}
        >
          <Divider orientation="left" plain style={{ marginTop: 0 }}>
            基础信息
          </Divider>
          <Form.Item label="品牌" name="brandId" rules={[{ required: true, message: '请选择品牌' }]}>
            <Select allowClear options={brandIdOptions} placeholder="品牌" />
          </Form.Item>
          <Form.Item label="商品名称" name="name" rules={[{ required: true, message: '请输入商品名称' }]}>
            <Input allowClear placeholder="商品名称" />
          </Form.Item>
          <Form.Item label="类目" name="categoryId" rules={[{ required: true, message: '请选择类目' }]}>
            <Select allowClear options={categoryIdOptions} placeholder="类目" />
          </Form.Item>
          <Form.Item
            label="指导价（元）"
            name="guidePriceYuan"
            rules={[{ required: true, message: '请输入指导价' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="指导价（元）" />
          </Form.Item>
          <Form.Item label="供货价（元）" name="supplyPriceYuan">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="供货价（元）" />
          </Form.Item>
          <Form.Item label="封面图" name="defaultImg" valuePropName="value">
            <AdminOssImageUploader usage="brand_product" placeholder="上传封面" />
          </Form.Item>
          <Form.Item
            label="商品相册"
            name="imageList"
            valuePropName="value"
            extra="详情页商品图区轮播展示, 不含封面图; 最多 9 张"
          >
            <AdminOssImageGalleryUploader usage="brand_product" placeholder="上传图片" />
          </Form.Item>
          <Form.Item label="商品说明" name="description">
            <Input.TextArea rows={3} placeholder="商品说明（用作店铺铺货时的默认描述）" />
          </Form.Item>

          <Divider orientation="left" plain>
            详情页内容
          </Divider>
          <Form.Item
            label="主图视频"
            name="videoUrl"
            valuePropName="value"
            extra="可选；mp4 / webm / mov，最大 50MB。上传后商品图区第一帧会自动切换为视频"
          >
            <AdminOssVideoUploader usage="brand_product" placeholder="上传视频" />
          </Form.Item>
          <Form.Item label="详情 HTML" name="detailHtml" extra="商品详情 tab 的内容；支持 HTML 标签（来源信任范围内）">
            <Input.TextArea rows={6} placeholder="<p>...</p>" />
          </Form.Item>
          <Form.Item label="参数表" extra="参数 tab 显示，按顺序展示">
            <Form.List name="specTable">
              {(fields, { add, remove }) => (
                <Space direction="vertical" size={8} style={{ display: 'flex', width: '100%' }}>
                  {fields.map(({ key, name, ...rest }) => (
                    <Space key={key} align="baseline" style={{ display: 'flex' }}>
                      <Form.Item
                        {...rest}
                        name={[name, 'key']}
                        rules={[{ required: true, message: '请输入参数名' }]}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <Input placeholder="参数名（如 产地）" />
                      </Form.Item>
                      <Form.Item
                        {...rest}
                        name={[name, 'value']}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <Input placeholder="参数值（如 法国）" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add({ key: '', value: '' })} icon={<PlusOutlined />}>
                    添加参数
                  </Button>
                </Space>
              )}
            </Form.List>
          </Form.Item>
          <Form.Item label="包装清单" extra="清单 tab 显示，逐行配置">
            <Form.List name="packageList">
              {(fields, { add, remove }) => (
                <Space direction="vertical" size={8} style={{ display: 'flex', width: '100%' }}>
                  {fields.map(({ key, name, ...rest }) => (
                    <Space key={key} align="baseline" style={{ display: 'flex' }}>
                      <Form.Item
                        {...rest}
                        name={[name, 'value']}
                        rules={[{ required: true, message: '请输入清单项' }]}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <Input placeholder="如 商品 ×1" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add({ value: '' })} icon={<PlusOutlined />}>
                    添加清单项
                  </Button>
                </Space>
              )}
            </Form.List>
          </Form.Item>

          <Divider orientation="left" plain>
            发货
          </Divider>
          <Form.Item label="运费（元）" name="freightYuan" extra="留空 = 包邮">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0 = 包邮" />
          </Form.Item>
          <Form.Item label="发货地" name="shipFrom">
            <Input allowClear placeholder="如 上海" />
          </Form.Item>
          <Form.Item label="发货时效" name="deliveryDays">
            <Input allowClear placeholder="如 24h内发货" />
          </Form.Item>

          <Divider orientation="left" plain>
            状态
          </Divider>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'disabled' },
              ]}
              placeholder="状态"
            />
          </Form.Item>
        </Form>
      </ConfigProvider>
    </Modal>
  );
}
