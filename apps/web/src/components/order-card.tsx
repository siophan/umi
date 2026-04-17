import type { OrderSummary } from '@joy/shared';

export function OrderCard({ order }: { order: OrderSummary }) {
  const item = order.items[0];

  return (
    <article className="order-card">
      <div className="order-card__header">
        <div className="order-card__shop">优米官方仓</div>
        <div className={`order-card__status status-${order.status}`}>{order.status}</div>
      </div>
      <div className="order-card__item">
        <div
          className="order-card__thumb"
          style={{ backgroundImage: `url(${item.productImg})` }}
        />
        <div className="order-card__info">
          <h3>{item.productName}</h3>
          <p>规格默认 · x{item.quantity}</p>
          <strong>¥{order.amount}</strong>
        </div>
      </div>
      <div className="order-card__footer">
        <span>下单时间 {new Date(order.createdAt).toLocaleDateString('zh-CN')}</span>
        <div className="order-card__actions">
          <button type="button">查看详情</button>
          <button className="accent" type="button">
            {order.status === 'shipping' ? '查看物流' : '再次购买'}
          </button>
        </div>
      </div>
    </article>
  );
}
