import type { AdminCategoryItem } from '../lib/api/categories';
import type { AdminProduct } from '../lib/api/catalog';
import { Alert, ConfigProvider, Form, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AdminGuessCreateBasicCard } from '../components/admin-guess-create-basic-card';
import { AdminGuessCreateOptionsCard } from '../components/admin-guess-create-options-card';
import { AdminGuessCreatePreviewCard } from '../components/admin-guess-create-preview-card';
import { SEARCH_THEME } from '../components/admin-list-controls';
import { fetchAdminCategories } from '../lib/api/categories';
import { createAdminGuess, fetchAdminProducts } from '../lib/api/catalog';
import {
  buildGuessCategoryOptions,
  buildGuessPreviewOptions,
  GUESS_CREATE_INITIAL_VALUES,
  toCreateGuessPayload,
  type GuessCreateFormValues,
} from '../lib/admin-guess-create';

interface GuessCreatePageProps {
  refreshToken?: number;
}

export function GuessCreatePage({ refreshToken = 0 }: GuessCreatePageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<GuessCreateFormValues>();
  const [issue, setIssue] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bootLoading, setBootLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [productOptions, setProductOptions] = useState<AdminProduct[]>([]);
  const productCacheRef = useRef<Record<string, AdminProduct>>({});

  const selectedProductId = Form.useWatch('productId', form);
  const optionValues = Form.useWatch('optionTexts', form);

  useEffect(() => {
    let alive = true;

    async function loadBootstrap() {
      setBootLoading(true);
      setIssue(null);
      try {
        const [categoriesResult, productsResult] = await Promise.all([
          fetchAdminCategories(),
          fetchAdminProducts({ page: 1, pageSize: 20, status: 'active' }),
        ]);

        if (!alive) {
          return;
        }

        const guessCategories = categoriesResult.items.filter(
          (item) => item.bizType === 'guess' && item.status === 'active',
        );
        setCategories(guessCategories);
        setProductOptions(productsResult.items);
        productCacheRef.current = productsResult.items.reduce<Record<string, AdminProduct>>(
          (acc, item) => {
            acc[item.id] = item;
            return acc;
          },
          {},
        );
      } catch (error) {
        if (!alive) {
          return;
        }
        setCategories([]);
        setProductOptions([]);
        setIssue(error instanceof Error ? error.message : '创建竞猜页加载失败');
      } finally {
        if (alive) {
          setBootLoading(false);
        }
      }
    }

    void loadBootstrap();

    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const categoryOptions = useMemo(
    () => buildGuessCategoryOptions(categories),
    [categories],
  );

  const selectedProduct = selectedProductId
    ? productCacheRef.current[selectedProductId] ?? null
    : null;

  const previewOptions = useMemo(
    () => buildGuessPreviewOptions(optionValues),
    [optionValues],
  );

  async function loadProductOptions(keyword: string) {
    setProductLoading(true);
    try {
      const result = await fetchAdminProducts({
        page: 1,
        pageSize: 20,
        keyword: keyword.trim() || undefined,
        status: 'active',
      });
      setProductOptions(result.items);
      productCacheRef.current = result.items.reduce<Record<string, AdminProduct>>((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, productCacheRef.current);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '商品搜索失败');
    } finally {
      setProductLoading(false);
    }
  }

  async function handleSubmit() {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await createAdminGuess(toCreateGuessPayload(values));
      messageApi.success('竞猜已创建并发布');
      window.location.hash = '#/guesses/list';
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      <ConfigProvider theme={SEARCH_THEME}>
        <Form<GuessCreateFormValues>
          form={form}
          layout="vertical"
          initialValues={GUESS_CREATE_INITIAL_VALUES}
        >
          <AdminGuessCreateBasicCard
            bootLoading={bootLoading}
            categoryOptions={categoryOptions}
            productLoading={productLoading}
            productOptions={productOptions}
            onProductSearch={(value) => {
              void loadProductOptions(value);
            }}
            onProductFocus={() => {
              if (productOptions.length === 0) {
                void loadProductOptions('');
              }
            }}
          />
          <AdminGuessCreateOptionsCard bootLoading={bootLoading} />
          <AdminGuessCreatePreviewCard
            bootLoading={bootLoading}
            previewOptions={previewOptions}
            selectedProduct={selectedProduct}
            submitting={submitting}
            onSubmit={() => {
              void handleSubmit();
            }}
            onBack={() => {
              window.location.hash = '#/guesses/list';
            }}
          />
        </Form>
      </ConfigProvider>
    </div>
  );
}
