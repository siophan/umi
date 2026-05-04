'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toEntityId, type CouponListItem, type EntityId, type UserAddressItem } from '@umi/shared';

import { fetchAddresses } from '../../lib/api/address';
import { fetchCart } from '../../lib/api/cart';
import { fetchCoupons } from '../../lib/api/coupons';
import { createOrder } from '../../lib/api/orders';
import { fetchProductDetail } from '../../lib/api/products';
import { hasAuthToken } from '../../lib/api/shared';
import styles from './page.module.css';
import { PaymentOrderSections } from './payment-order-sections';
import { PaymentOverlays } from './payment-overlays';
import { getCouponDiscount, getErrorMessage, type PaymentProduct } from './payment-helpers';

/**
 * 支付页主体。
 * 支持两条入口：商品详情直接购买，以及购物车勾选项结算。
 */
function PaymentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [addresses, setAddresses] = useState<UserAddressItem[]>([]);
  const [products, setProducts] = useState<PaymentProduct[]>([]);
  const [coupons, setCoupons] = useState<CouponListItem[]>([]);
  const [addressIndex, setAddressIndex] = useState(0);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [method, setMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [addrOpen, setAddrOpen] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [remark, setRemark] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!hasAuthToken()) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    let ignore = false;

    /**
     * 加载支付页首屏所需数据。
     * 地址、优惠券、商品来源分开处理，避免一条弱依赖失败把整页拖垮。
     */
    async function load() {
      if (!hasAuthToken()) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setAddressError(null);
      setCouponError(null);
      try {
        const from = searchParams.get('from');
        const [addressResult, couponResult] = await Promise.all([
          fetchAddresses()
            .then((result) => ({ ok: true as const, result }))
            .catch((error) => ({ ok: false as const, error })),
          fetchCoupons()
            .then((result) => ({ ok: true as const, result }))
            .catch((error) => ({ ok: false as const, error })),
        ]);

        if (ignore) {
          return;
        }

        if (addressResult.ok) {
          setAddresses(addressResult.result);
          const defaultIndex = addressResult.result.findIndex((item) => item.isDefault);
          setAddressIndex(defaultIndex >= 0 ? defaultIndex : 0);
        } else {
          setAddresses([]);
          setAddressIndex(0);
          setAddressError(getErrorMessage(addressResult.error, '收货地址读取失败'));
        }

        if (couponResult.ok) {
          setCoupons(couponResult.result.filter((item) => item.status === 'unused'));
        } else {
          setCoupons([]);
          setCouponId(null);
          setCouponError(getErrorMessage(couponResult.error, '优惠券读取失败'));
        }

        if (from === 'cart') {
          const idsParam = searchParams.get('cartItemIds');
          const selectedIds = new Set(idsParam ? idsParam.split(',').filter(Boolean) : []);
          if (selectedIds.size === 0) {
            setProducts([]);
            return;
          }
          const cartResult = await fetchCart();
          if (ignore) return;
          setProducts(
            cartResult.items
              .filter((item) => selectedIds.has(item.id))
              .map((item) => ({
                productId: item.productId,
                brandProductSkuId: item.brandProductSkuId,
                cartItemId: item.id,
                name: item.name,
                price: item.price,
                qty: Math.max(1, item.quantity),
                orig: item.originalPrice,
                img: item.img,
              })),
          );
          return;
        }

        const productId = searchParams.get('pid');
        if (!productId) {
          setProducts([]);
          return;
        }

        const detail = await fetchProductDetail(productId);
        if (ignore) {
          return;
        }
        // 解析 skuId：URL 显式传入优先；多规格商品没传则报错；单规格商品自动落 default sku。
        const skuIdParam = searchParams.get('skuId');
        const skus = detail.product.skus ?? [];
        const specDefs = detail.product.specDefinitions ?? null;
        let resolvedSku = skuIdParam ? skus.find((s) => s.id === skuIdParam) ?? null : null;
        if (!resolvedSku && (!specDefs || specDefs.length === 0)) {
          resolvedSku = skus.find((s) => s.status === 'active') ?? skus[0] ?? null;
        }
        const resolvedPrice = resolvedSku ? resolvedSku.guidePrice : detail.product.price;
        const resolvedImg = resolvedSku?.image || detail.product.img;
        setProducts([
          {
            productId: detail.product.id,
            brandProductSkuId: resolvedSku?.id,
            name: detail.product.name,
            price: resolvedPrice,
            qty: Math.max(1, Number(searchParams.get('qty') || 1) || 1),
            orig: detail.product.originalPrice,
            img: resolvedImg,
          },
        ]);
      } catch (error) {
        if (!ignore) {
          setProducts([]);
          setAddresses([]);
          setCoupons([]);
          setToast(error instanceof Error ? error.message : '订单信息加载失败');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [searchParams, reloadToken]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedAddress = addresses[addressIndex] || null;
  const selectedCoupon = coupons.find((item) => item.id === couponId) || null;
  const subtotal = useMemo(
    () => products.reduce((sum, item) => sum + item.price * item.qty, 0),
    [products],
  );
  const couponValue = useMemo(
    () => getCouponDiscount(selectedCoupon, subtotal),
    [selectedCoupon, subtotal],
  );
  const total = useMemo(() => Math.max(0, subtotal - couponValue), [couponValue, subtotal]);
  const availableCoupons = useMemo(
    () => coupons.filter((item) => getCouponDiscount(item, subtotal) > 0),
    [coupons, subtotal],
  );

  /**
   * 提交订单 + 跳转真实支付。
   * 后端创建 PENDING 订单 + 调网关，返回 payUrl 直接跳走。
   * 用户付款完成后由网关回跳到 /payment/return?orderId=xxx 页面轮询状态。
   */
  async function submitOrder() {
    if (submitting) {
      return;
    }
    if (!selectedAddress) {
      setToast('请先选择收货地址');
      return;
    }
    if (!products.length) {
      setToast('没有可提交的商品');
      return;
    }

    const from = searchParams.get('from');
    const source = from === 'cart' ? 'cart' : 'product';
    const cartItemIds = products
      .map((item) => item.cartItemId)
      .filter((item): item is string => Boolean(item))
      .map((item) => toEntityId<EntityId>(item));

    if (source === 'cart' && cartItemIds.length !== products.length) {
      setToast('购物车商品信息已过期，请返回购物车重试');
      return;
    }

    if (source === 'product' && !products[0]?.brandProductSkuId) {
      setToast('请先选择商品规格');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createOrder({
        source,
        addressId: selectedAddress.id,
        couponId: selectedCoupon?.id || null,
        payChannel: method,
        note: remark.trim() || null,
        productId:
          source === 'product' && products[0]?.productId
            ? toEntityId(products[0].productId)
            : undefined,
        brandProductSkuId:
          source === 'product' && products[0]?.brandProductSkuId
            ? toEntityId(products[0].brandProductSkuId)
            : undefined,
        quantity: source === 'product' ? products[0]?.qty : undefined,
        cartItemIds: source === 'cart' ? cartItemIds : undefined,
      });

      window.location.href = result.payUrl;
    } catch (error) {
      setToast(error instanceof Error ? error.message : '下单失败');
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <PaymentOrderSections
        loading={loading}
        addressError={addressError}
        selectedAddress={selectedAddress}
        products={products}
        couponError={couponError}
        availableCoupons={availableCoupons}
        selectedCoupon={selectedCoupon}
        couponValue={couponValue}
        method={method}
        remark={remark}
        subtotal={subtotal}
        total={total}
        submitting={submitting}
        canSubmit={Boolean(products.length && selectedAddress && !addressError && !submitting)}
        onBack={() => router.back()}
        onRetry={() => setReloadToken((current) => current + 1)}
        onManageAddresses={() => router.push('/address')}
        onAddressOpen={() => setAddrOpen(true)}
        onCouponOpen={() => setCouponOpen(true)}
        onMethodChange={setMethod}
        onRemarkChange={setRemark}
        onSubmit={() => void submitOrder()}
      />
      <PaymentOverlays
        addrOpen={addrOpen}
        couponOpen={couponOpen}
        toast={toast}
        addresses={addresses}
        addressIndex={addressIndex}
        availableCoupons={availableCoupons}
        couponId={couponId}
        onAddressClose={() => setAddrOpen(false)}
        onAddressSelect={(index) => {
          setAddressIndex(index);
          setAddrOpen(false);
        }}
        onCouponClose={() => setCouponOpen(false)}
        onCouponSelect={(nextCouponId) => {
          setCouponId(nextCouponId);
          setCouponOpen(false);
        }}
        onToastClear={() => setToast('')}
      />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <PaymentPageInner />
    </Suspense>
  );
}
