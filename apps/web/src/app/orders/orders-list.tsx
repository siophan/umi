'use client';

import type { OrderSummary } from '@umi/shared';

import styles from './page.module.css';
import {
  defaultOrderActions,
  emptyMap,
  getExpressText,
  getOrderStatusClass,
  getOrderStatusText,
  getShopIcon,
  getShopName,
  mapOrderToTab,
  type OrderAction,
  type OrderTab,
} from './order-helpers';

type OrdersListProps = {
  loading: boolean;
  error: string | null;
  tab: OrderTab;
  orders: OrderSummary[];
  onReload: () => void;
  onGoGuess: () => void;
  onOpenDetail: (orderId: string) => void;
  onAction: (order: OrderSummary, action: OrderAction) => void;
};

export function OrdersList({
  loading,
  error,
  tab,
  orders,
  onReload,
  onGoGuess,
  onOpenDetail,
  onAction,
}: OrdersListProps) {
  return (
    <main className={styles.list}>
      {!loading && error ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⚠️</div>
          <div className={styles.emptyTitle}>订单加载失败</div>
          <div className={styles.emptyDesc}>{error}</div>
          <button className={styles.emptyBtn} type="button" onClick={onReload}>
            <i className="fa-solid fa-rotate-right" />
            重新加载
          </button>
        </div>
      ) : !loading && orders.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>{emptyMap[tab].icon}</div>
          <div className={styles.emptyTitle}>{emptyMap[tab].title}</div>
          <div className={styles.emptyDesc}>{emptyMap[tab].desc}</div>
          <button className={styles.emptyBtn} type="button" onClick={onGoGuess}>
            <i className="fa-solid fa-gamepad" />
            去竞猜
          </button>
        </div>
      ) : (
        orders.map((order, index) => {
          const item = order.items[0];
          return (
            <article
              key={order.id}
              className={styles.card}
              style={{ animationDelay: `${Math.min(index * 0.04, 0.24)}s` }}
            >
              <div className={styles.cardHeader}>
                <div className={styles.shopName}>
                  <span className={styles.shopIcon}>
                    <i className={getShopIcon(order)} />
                  </span>
                  {getShopName(order)}
                </div>
                <span className={`${styles.status} ${getOrderStatusClass(order.status)}`}>
                  {getOrderStatusText(order.status)}
                </span>
              </div>

              {order.guessId ? (
                <div className={styles.guessTitle}>
                  <span>
                    <i className="fa-solid fa-trophy" />
                  </span>
                  {order.guessTitle || '猜中竞猜奖励'}
                </div>
              ) : null}

              <button type="button" className={styles.item} onClick={() => onOpenDetail(order.id)}>
                <img
                  className={styles.itemImg}
                  src={item?.productImg || '/legacy/images/products/p001-lays.jpg'}
                  alt={item?.productName || order.id}
                />
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{item?.productName || '订单商品'}</div>
                  <div className={styles.itemSpec}>{item?.skuText || `共 ${order.items.length} 件商品`}</div>
                  <div className={styles.itemBottom}>
                    <span className={`${styles.type} ${styles[order.orderType === 'guess' || order.guessId ? 'type-prize' : 'type-buy']}`}>
                      {order.orderType === 'guess' || order.guessId ? '🎯 竞猜获奖' : '🛒 直接购买'}
                    </span>
                    <span className={`${styles.price} ${order.amount === 0 ? styles.free : ''}`}>
                      {order.amount === 0 ? (
                        '🎁 免费'
                      ) : (
                        <>
                          <small>¥</small>
                          {order.amount.toFixed(1)}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </button>

              {getExpressText(order) ? (
                <div className={styles.express}>
                  <span className={styles.expressIcon}>
                    <i className="fa-solid fa-arrow-right-long" />
                  </span>
                  <span className={styles.expressText}>{getExpressText(order)}</span>
                </div>
              ) : null}

              <div className={styles.footer}>
                <span className={styles.time}>{new Date(order.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
                <div className={styles.actions}>
                  {defaultOrderActions[mapOrderToTab(order.status) as Exclude<OrderTab, 'all'>].map((action) => (
                    <button
                      key={action.text}
                      type="button"
                      className={`${styles.btn} ${action.tone === 'primary' ? styles.primary : ''} ${action.tone === 'accent' ? styles.btnAccent : ''}`}
                      onClick={() => onAction(order, action)}
                    >
                      {action.text}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          );
        })
      )}
    </main>
  );
}
