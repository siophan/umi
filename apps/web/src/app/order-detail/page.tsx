'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { OrderDetailResult } from '@umi/shared';

import { confirmOrder, fetchOrderDetail } from '../../lib/api/orders';
import { hasAuthToken } from '../../lib/api/shared';
import styles from './page.module.css';

/**
 * 生成订单详情页顶部状态横幅。
 * 这里把真实订单状态收口成用户端固定的文案、说明和配色类。
 */
function getStatusMeta(order: OrderDetailResult | null) {
  if (!order) {
    return { text: '', desc: '', cls: 'shipped' };
  }
  if (order.status === 'completed' || order.status === 'delivered') {
    return { text: '已完成', desc: '交易完成，感谢您的购买', cls: 'done' };
  }
  if (order.status === 'refunded') {
    return { text: '已退款', desc: '订单已退款完成', cls: 'refund' };
  }
  if (order.status === 'shipping') {
    return { text: '已发货', desc: '包裹正在运送中', cls: 'shipped' };
  }
  if (order.status === 'paid') {
    return { text: '待发货', desc: '商家正在准备商品', cls: 'shipped' };
  }
  if (order.status === 'cancelled') {
    return { text: '已取消', desc: '订单已关闭', cls: 'refund' };
  }
  return { text: '待支付', desc: '等待支付完成', cls: 'shipped' };
}

/**
 * 订单详情页主体。
 * 数据来自真实订单详情接口，物流、地址、商品、日志都围绕同一条订单链展示。
 */
function OrderDetailPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderDetailResult | null>(null);
  const [toast, setToast] = useState('');
  const [logisticsOpen, setLogisticsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAuthToken()) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    let ignore = false;

    /**
     * 加载订单详情。
     * 通过 ignore 避免路由切换后旧请求回写页面状态。
     */
    async function load() {
      if (!hasAuthToken()) {
        setLoading(false);
        return;
      }
      const orderId = searchParams.get('id');
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const result = await fetchOrderDetail(orderId);
        if (!ignore) {
          setOrder(result);
        }
      } catch (error) {
        if (!ignore) {
          setToast(error instanceof Error ? error.message : '订单加载失败');
          setOrder(null);
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
  }, [searchParams]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const meta = getStatusMeta(order);
  const firstItem = order?.items[0] || null;
  const addressText = order?.address
    ? `${order.address.province}${order.address.city}${order.address.district}${order.address.detail}`
    : '';
  const total = order ? `¥${order.amount.toFixed(2)}` : '¥0.00';
  const timeline = useMemo(
    () => (order?.logs.length ? order.logs : []),
    [order],
  );

  if (loading) {
    return <div className={styles.page} />;
  }

  if (!order || !firstItem) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.back} type="button" onClick={() => router.back()}>
            <i className="fa-solid fa-chevron-left" />
          </button>
          <div className={styles.title}>订单详情</div>
          <div className={styles.headerRight} />
        </header>
        <section className={styles.card}>
          <div className={styles.cardTitle}>订单不存在</div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.title}>订单详情</div>
        <div className={styles.headerRight}>
          <button className={styles.headerBtn} type="button" onClick={() => setToast('客服')}>
            <i className="fa-solid fa-headset" />
          </button>
        </div>
      </header>

      <section className={`${styles.banner} ${styles[meta.cls]}`}>
        <div className={styles.bannerMain}>
          <div className={styles.bannerIcon}>
            <i className="fa-solid fa-truck-fast" />
          </div>
          <div>
            <div className={styles.bannerTitle}>{meta.text}</div>
            <div className={styles.bannerDesc}>{meta.desc}</div>
          </div>
        </div>
        <div className={styles.bannerBg}>
          <i className="fa-solid fa-truck-fast" />
        </div>
      </section>

      <section className={styles.timelineCard}>
        <div className={styles.cardTitle}>
          <i className="fa-solid fa-route" />
          订单进度
        </div>
        <div className={styles.timeline}>
          {timeline.map((item, index) => (
            <div key={item.id} className={`${styles.timelineItem} ${styles.done} ${index === timeline.length - 1 ? styles.active : ''}`}>
              <div className={styles.dot}>
                <span>•</span>
              </div>
              <div className={styles.timelineText}>{item.status}</div>
              <div className={styles.timelineTime}>{item.createdAt.slice(0, 16).replace('T', ' ')}</div>
              {item.note ? <div className={styles.timelineDetail}>{item.note}</div> : null}
            </div>
          ))}
        </div>
      </section>

      {order.fulfillment ? (
        <section className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-truck-fast" />
            物流信息
          </div>
          <button className={styles.express} type="button" onClick={() => setLogisticsOpen(true)}>
            <div className={styles.expressIcon}>
              <i className="fa-solid fa-truck-fast" />
            </div>
            <div className={styles.expressInfo}>
              <div className={styles.expressCompany}>
                普通快递 <span>{order.fulfillment.trackingNo || '待分配运单'}</span>
              </div>
              <div className={styles.expressStatus}>
                <i className="fa-solid fa-circle" />
                {order.fulfillment.status === 'shipping' ? '物流运输中' : order.fulfillment.status === 'completed' ? '已签收' : '待发货'}
              </div>
              <div className={styles.expressNo}>收件人: {order.fulfillment.receiverName}</div>
            </div>
            <div className={styles.expressArrow}>
              <i className="fa-solid fa-chevron-right" />
            </div>
          </button>
        </section>
      ) : null}

      {order.address ? (
        <section className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-location-dot" />
            收货地址
          </div>
          <div className={styles.address}>
            <div className={styles.addressIcon}>
              <i className="fa-solid fa-location-dot" />
            </div>
            <div className={styles.addressInfo}>
              <div className={styles.addressName}>
                {order.address.name}
                <span>{order.address.phone}</span>
                {order.address.tag ? <span className={styles.addressTag}>{order.address.tag}</span> : null}
              </div>
              <div className={styles.addressDetail}>{addressText}</div>
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.card}>
        <button className={styles.shopRow} type="button" onClick={() => setToast('进入店铺')}>
          <div className={styles.shopIcon}>
            <i className="fa-solid fa-crown" />
          </div>
          <div className={styles.shopName}>{order.orderType === 'guess' ? '竞猜奖励' : '店铺订单'}</div>
          <div className={styles.arrow}>
            <i className="fa-solid fa-chevron-right" />
          </div>
        </button>

        <div className={styles.product}>
          <img alt={firstItem.productName} src={firstItem.productImg} />
          <div className={styles.productInfo}>
            <div className={styles.productName}>{firstItem.productName}</div>
            <div className={styles.productSpec}>{firstItem.skuText || '默认规格'}</div>
            <div className={styles.productBottom}>
              <span className={styles.productType}>{order.orderType === 'guess' ? '🎯 竞猜奖励' : '🛒 商城购买'}</span>
              <span className={styles.productPrice}>
                <small>¥</small>
                {firstItem.unitPrice.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {order.guessId && order.guessTitle ? (
          <button className={styles.guessInfo} type="button" onClick={() => router.push(`/guess/${order.guessId}`)}>
            <div className={styles.guessIcon}>🎯</div>
            <div className={styles.guessText}>
              <div className={styles.guessLabel}>关联竞猜</div>
              <div className={styles.guessTitle}>{order.guessTitle}</div>
            </div>
            <div className={styles.guessArrow}>
              <i className="fa-solid fa-chevron-right" />
            </div>
          </button>
        ) : null}
      </section>

      <section className={styles.card}>
        <div className={styles.cardTitle}>
          <i className="fa-solid fa-receipt" />
          价格明细
        </div>
        {order.coupon ? (
          <div className={styles.couponCard}>
            <div className={styles.couponIcon}>🎫</div>
            <div className={styles.couponInfo}>
              <div className={styles.couponAmount}>¥{order.coupon.amount.toFixed(1)}</div>
              <div className={styles.couponCond}>{order.coupon.condition || order.coupon.name}</div>
            </div>
            <div className={styles.couponTag}>{order.coupon.name}</div>
          </div>
        ) : null}
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>商品金额</span>
          <span className={styles.priceValue}>¥{order.originalAmount.toFixed(2)}</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>优惠金额</span>
          <span className={`${styles.priceValue} ${styles.discount}`}>-¥{order.couponDiscount.toFixed(2)}</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>运费</span>
          <span className={`${styles.priceValue} ${styles.freeValue}`}>包邮</span>
        </div>
        <div className={styles.priceTotal}>
          <span>实付款：</span>
          <strong>{total}</strong>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardTitle}>
          <i className="fa-solid fa-file-lines" />
          订单信息
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>订单编号</span>
          <span className={`${styles.infoValue} ${styles.copy}`} onClick={() => setToast(`已复制: ${order.orderSn}`)}>
            {order.orderSn}
            <i className="fa-regular fa-copy" />
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>下单时间</span>
          <span className={styles.infoValue}>{order.createdAt.slice(0, 16).replace('T', ' ')}</span>
        </div>
        {order.fulfillment?.shippedAt ? (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>发货时间</span>
            <span className={styles.infoValue}>{order.fulfillment.shippedAt.slice(0, 16).replace('T', ' ')}</span>
          </div>
        ) : null}
      </section>

      <footer className={styles.bottom}>
        <div className={styles.bottomLeft}>
          <button className={styles.bottomIcon} type="button" onClick={() => setToast('联系客服')}>
            <i className="fa-solid fa-headset" />
            <span>客服</span>
          </button>
          <button className={styles.bottomIcon} type="button" onClick={() => setToast('进入店铺')}>
            <i className="fa-solid fa-store" />
            <span>店铺</span>
          </button>
        </div>
        <button className={styles.btnOutline} type="button" onClick={() => setToast(order.fulfillment ? '查看物流' : '订单处理中')}>
          {order.fulfillment ? '查看物流' : '订单处理中'}
        </button>
        <button
          className={styles.btnPrimary}
          type="button"
          onClick={async () => {
            if (order.status === 'shipping' || order.status === 'delivered') {
              try {
                await confirmOrder(order.id);
                setOrder((current) => (current ? { ...current, status: 'completed' } : current));
                setToast('✅ 已确认收货');
              } catch (error) {
                setToast(error instanceof Error ? error.message : '确认收货失败');
              }
              return;
            }
            if (order.status === 'completed' && firstItem?.productId) {
              router.push(`/review?orderId=${encodeURIComponent(order.id)}&productId=${encodeURIComponent(firstItem.productId)}`);
              return;
            }
            setToast('订单处理中');
          }}
        >
          {order.status === 'shipping' || order.status === 'delivered' ? '确认收货' : order.status === 'completed' ? '评价' : '提醒发货'}
        </button>
      </footer>

      {logisticsOpen && order.fulfillment ? (
        <div className={styles.modalOverlay} onClick={() => setLogisticsOpen(false)} role="presentation">
          <div className={styles.modal} onClick={(event) => event.stopPropagation()} role="presentation">
            <div className={styles.modalHandle} />
            <div className={styles.modalTitle}>📦 物流详情</div>
            <div className={styles.logisticsHeader}>
              <div>
                <div className={styles.logisticsCompany}>普通快递</div>
                <div className={styles.logisticsNo}>{order.fulfillment.trackingNo || '待分配运单号'}</div>
              </div>
              {order.fulfillment.trackingNo ? (
                <button type="button" className={styles.copyBtn} onClick={() => setToast(`已复制: ${order.fulfillment?.trackingNo}`)}>
                  <i className="fa-regular fa-copy" />
                  复制
                </button>
              ) : null}
            </div>
            {timeline.map((log, index) => (
              <div key={log.id} className={styles.logisticsItem}>
                <div className={`${styles.logisticsDot} ${index === timeline.length - 1 ? styles.logisticsActive : styles.logisticsDone}`}>
                  <i className={`fa-solid ${index === timeline.length - 1 ? 'fa-location-dot' : 'fa-check'}`} />
                </div>
                <div>
                  <div className={styles.logisticsText}>{log.status}</div>
                  <div className={styles.logisticsTime}>{log.createdAt.slice(0, 16).replace('T', ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <OrderDetailPageInner />
    </Suspense>
  );
}
