import {
  Button,
  ConfigProvider,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

import { AdminOssImageGalleryUploader } from './admin-oss-image-gallery-uploader';
import { AdminOssImageUploader } from './admin-oss-image-uploader';
import { AdminOssVideoUploader } from './admin-oss-video-uploader';
import { SEARCH_THEME } from './admin-list-controls';
import type {
  BrandProductFormValues,
  BrandProductSkuFormRow,
} from '../lib/admin-brand-library';
import type { AdminBrandProductSpecDefinition } from '../lib/api/catalog';

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

function buildSpecSignature(spec: Record<string, string>) {
  const keys = Object.keys(spec).sort();
  return keys.map((key) => `${key}=${spec[key]}`).join(';');
}

function summarizeSpec(spec: Record<string, string>) {
  const entries = Object.entries(spec);
  if (entries.length === 0) {
    return '默认规格';
  }
  return entries.map(([, value]) => value).join(' / ');
}

function generateSkuRows(
  specDefinitions: AdminBrandProductSpecDefinition[],
  existing: BrandProductSkuFormRow[],
): BrandProductSkuFormRow[] {
  const cleaned = specDefinitions
    .map((def) => ({
      name: (def?.name ?? '').trim(),
      values: (def?.values ?? [])
        .map((v) => (typeof v === 'string' ? v.trim() : ''))
        .filter((v) => v.length > 0),
    }))
    .filter((def) => def.name && def.values.length > 0);

  if (cleaned.length === 0) {
    return [];
  }

  // 笛卡尔积
  let combos: Record<string, string>[] = [{}];
  for (const def of cleaned) {
    const next: Record<string, string>[] = [];
    for (const acc of combos) {
      for (const value of def.values) {
        next.push({ ...acc, [def.name]: value });
      }
    }
    combos = next;
  }

  const existingMap = new Map<string, BrandProductSkuFormRow>();
  for (const row of existing) {
    existingMap.set(buildSpecSignature(row.spec ?? {}), row);
  }

  return combos.map((spec) => {
    const sig = buildSpecSignature(spec);
    const old = existingMap.get(sig);
    if (old) {
      return { ...old, spec };
    }
    return {
      spec,
      guidePriceYuan: 0,
      stock: 0,
      status: 'active' as const,
    };
  });
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
      width={840}
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
          <Form.Item label="联名" name="collab" extra="联名信息文案，用于商品列表/详情页徽标；可留空">
            <Input allowClear placeholder="如 LISA × CELINE" />
          </Form.Item>
          <Form.Item label="标签" name="tags" extra="回车 / 逗号添加；用于商品列表/详情页徽标">
            <Select
              mode="tags"
              allowClear
              tokenSeparators={[',', '，']}
              placeholder="如 新品、限定、联名"
            />
          </Form.Item>

          <Divider orientation="left" plain>
            规格 & SKU
          </Divider>
          <Form.Item
            label="多规格商品"
            name="multiSpec"
            valuePropName="checked"
            extra="开启后可声明颜色 / 尺寸等规格维度，按笛卡尔积生成 SKU；关闭则只有单一默认 SKU"
          >
            <Switch
              onChange={(checked) => {
                const current = form.getFieldsValue();
                const hasData =
                  (current.specDefinitions && current.specDefinitions.length > 0) ||
                  (current.skus && current.skus.length > 0);
                if (!hasData) {
                  if (checked) {
                    form.setFieldsValue({ specDefinitions: [], skus: [] });
                  } else {
                    form.setFieldsValue({
                      specDefinitions: [],
                      skus: [
                        {
                          spec: {},
                          guidePriceYuan: 0,
                          stock: 0,
                          status: 'active',
                        },
                      ],
                    });
                  }
                  return;
                }
                Modal.confirm({
                  title: '切换规格模式',
                  content: '切换会清空当前 SKU 配置，确认继续？',
                  okText: '确认',
                  cancelText: '取消',
                  onOk: () => {
                    if (checked) {
                      form.setFieldsValue({ specDefinitions: [], skus: [] });
                    } else {
                      form.setFieldsValue({
                        specDefinitions: [],
                        skus: [
                          {
                            spec: {},
                            guidePriceYuan: 0,
                            stock: 0,
                            status: 'active',
                          },
                        ],
                      });
                    }
                  },
                  onCancel: () => {
                    // 撤回 toggle
                    form.setFieldsValue({ multiSpec: !checked });
                  },
                });
              }}
            />
          </Form.Item>

          <Form.Item shouldUpdate={(prev, next) => prev.multiSpec !== next.multiSpec} noStyle>
            {({ getFieldValue }) => {
              const multiSpec: boolean = !!getFieldValue('multiSpec');
              return (
                <>
                  {multiSpec ? (
                    <>
                      <Form.Item
                        label="规格定义"
                        extra="例如「颜色」可选「红 / 黑」、「尺寸」可选「S / M / L」；每个维度的值用回车 / 逗号添加"
                      >
                        <Form.List name="specDefinitions">
                          {(fields, { add, remove }) => (
                            <Space direction="vertical" size={8} style={{ display: 'flex', width: '100%' }}>
                              {fields.map(({ key, name, ...rest }) => (
                                <Space key={key} align="baseline" style={{ display: 'flex', width: '100%' }}>
                                  <Form.Item
                                    {...rest}
                                    name={[name, 'name']}
                                    rules={[{ required: true, message: '请输入规格名' }]}
                                    style={{ flex: 1, marginBottom: 0 }}
                                  >
                                    <Input placeholder="规格名（如 颜色）" />
                                  </Form.Item>
                                  <Form.Item
                                    {...rest}
                                    name={[name, 'values']}
                                    rules={[{ required: true, message: '请添加规格值' }]}
                                    style={{ flex: 2, marginBottom: 0 }}
                                  >
                                    <Select
                                      mode="tags"
                                      tokenSeparators={[',', '，']}
                                      placeholder="规格值（如 红、黑）"
                                    />
                                  </Form.Item>
                                  <MinusCircleOutlined onClick={() => remove(name)} />
                                </Space>
                              ))}
                              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Button
                                  type="dashed"
                                  onClick={() => add({ name: '', values: [] })}
                                  icon={<PlusOutlined />}
                                >
                                  添加规格维度
                                </Button>
                                <Button
                                  type="default"
                                  onClick={() => {
                                    const defs: AdminBrandProductSpecDefinition[] =
                                      form.getFieldValue('specDefinitions') ?? [];
                                    const existing: BrandProductSkuFormRow[] =
                                      form.getFieldValue('skus') ?? [];
                                    const next = generateSkuRows(defs, existing);
                                    form.setFieldsValue({ skus: next });
                                  }}
                                >
                                  按规格生成 SKU 表
                                </Button>
                              </Space>
                            </Space>
                          )}
                        </Form.List>
                      </Form.Item>

                      <Form.Item label="SKU 表" required>
                        <Form.List
                          name="skus"
                          rules={[
                            {
                              validator: async (_, value) => {
                                if (!value || value.length === 0) {
                                  throw new Error('请至少配置一个 SKU');
                                }
                              },
                            },
                          ]}
                        >
                          {(fields, _ops, { errors }) => (
                            <Space
                              direction="vertical"
                              size={12}
                              style={{ display: 'flex', width: '100%' }}
                            >
                              {fields.map(({ key, name, ...rest }) => (
                                <div
                                  key={key}
                                  style={{
                                    border: '1px solid #f0f0f0',
                                    borderRadius: 6,
                                    padding: 12,
                                  }}
                                >
                                  <Form.Item
                                    shouldUpdate={(prev, next) =>
                                      prev.skus?.[name]?.spec !== next.skus?.[name]?.spec
                                    }
                                    noStyle
                                  >
                                    {() => {
                                      const spec: Record<string, string> =
                                        form.getFieldValue(['skus', name, 'spec']) ?? {};
                                      return (
                                        <div style={{ marginBottom: 8 }}>
                                          <Tag color="blue">{summarizeSpec(spec)}</Tag>
                                        </div>
                                      );
                                    }}
                                  </Form.Item>
                                  <Space wrap style={{ width: '100%' }}>
                                    <Form.Item
                                      {...rest}
                                      label="SKU 编码"
                                      name={[name, 'skuCode']}
                                      style={{ marginBottom: 0, minWidth: 160 }}
                                    >
                                      <Input placeholder="如 IP15-RED-128G" />
                                    </Form.Item>
                                    <Form.Item
                                      {...rest}
                                      label="指导价（元）"
                                      name={[name, 'guidePriceYuan']}
                                      rules={[
                                        { required: true, message: '请输入指导价' },
                                        {
                                          type: 'number',
                                          min: 0.01,
                                          message: '指导价必须大于 0',
                                        },
                                      ]}
                                      style={{ marginBottom: 0, minWidth: 140 }}
                                    >
                                      <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                                    </Form.Item>
                                    <Form.Item
                                      {...rest}
                                      label="供货价（元）"
                                      name={[name, 'supplyPriceYuan']}
                                      style={{ marginBottom: 0, minWidth: 140 }}
                                    >
                                      <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                                    </Form.Item>
                                    <Form.Item
                                      {...rest}
                                      label="竞猜价（元）"
                                      name={[name, 'guessPriceYuan']}
                                      tooltip="留空时按指导价兜底"
                                      style={{ marginBottom: 0, minWidth: 140 }}
                                    >
                                      <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                                    </Form.Item>
                                    <Form.Item
                                      {...rest}
                                      label="库存"
                                      name={[name, 'stock']}
                                      rules={[
                                        { required: true, message: '请输入库存' },
                                        { type: 'number', min: 0, message: '库存不能为负' },
                                      ]}
                                      style={{ marginBottom: 0, minWidth: 120 }}
                                    >
                                      <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                                    </Form.Item>
                                    <Form.Item
                                      {...rest}
                                      label="SKU 主图"
                                      name={[name, 'image']}
                                      tooltip="留空使用商品封面"
                                      style={{ marginBottom: 0, minWidth: 200 }}
                                    >
                                      <Input allowClear placeholder="图片 URL" />
                                    </Form.Item>
                                    <Form.Item
                                      {...rest}
                                      label="状态"
                                      name={[name, 'status']}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Select
                                        style={{ width: 100 }}
                                        options={[
                                          { label: '启用', value: 'active' },
                                          { label: '停用', value: 'disabled' },
                                        ]}
                                      />
                                    </Form.Item>
                                  </Space>
                                </div>
                              ))}
                              <Form.ErrorList errors={errors} />
                            </Space>
                          )}
                        </Form.List>
                      </Form.Item>
                    </>
                  ) : (
                    <Form.List name="skus">
                      {(fields) => (
                        <>
                          {fields.length === 0 ? (
                            <Typography.Text type="secondary">默认 SKU 未初始化</Typography.Text>
                          ) : null}
                          {fields.map(({ key, name, ...rest }) => (
                            <div
                              key={key}
                              style={{
                                border: '1px solid #f0f0f0',
                                borderRadius: 6,
                                padding: 12,
                                marginBottom: 8,
                              }}
                            >
                              <Form.Item
                                {...rest}
                                label="指导价（元）"
                                name={[name, 'guidePriceYuan']}
                                rules={[
                                  { required: true, message: '请输入指导价' },
                                  { type: 'number', min: 0.01, message: '指导价必须大于 0' },
                                ]}
                              >
                                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                              </Form.Item>
                              <Form.Item
                                {...rest}
                                label="供货价（元）"
                                name={[name, 'supplyPriceYuan']}
                              >
                                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                              </Form.Item>
                              <Form.Item
                                {...rest}
                                label="竞猜价（元）"
                                name={[name, 'guessPriceYuan']}
                                extra="留空时按指导价兜底"
                              >
                                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                              </Form.Item>
                              <Form.Item
                                {...rest}
                                label="平台总库存"
                                name={[name, 'stock']}
                                rules={[
                                  { required: true, message: '请输入库存' },
                                  { type: 'number', min: 0, message: '库存不能为负' },
                                ]}
                                extra="跨店共享池；下单冻结、支付扣减"
                              >
                                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                              </Form.Item>
                              <Form.Item {...rest} label="SKU 编码" name={[name, 'skuCode']}>
                                <Input allowClear placeholder="可留空" />
                              </Form.Item>
                              <Form.Item {...rest} label="SKU 主图" name={[name, 'image']}>
                                <Input allowClear placeholder="留空使用商品封面" />
                              </Form.Item>
                              <Form.Item
                                {...rest}
                                noStyle
                                name={[name, 'spec']}
                                initialValue={{}}
                              >
                                <input type="hidden" />
                              </Form.Item>
                              <Form.Item
                                {...rest}
                                noStyle
                                name={[name, 'status']}
                                initialValue="active"
                              >
                                <input type="hidden" />
                              </Form.Item>
                            </div>
                          ))}
                        </>
                      )}
                    </Form.List>
                  )}
                </>
              );
            }}
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
