import { MobileShell } from '../../components/mobile-shell';
import { OrderCard } from '../../components/order-card';
import { PageHeader } from '../../components/page-header';
import { demoOrders } from '../../lib/demo';

export default function OrdersPage() {
  return (
    <MobileShell tab="orders">
      <PageHeader title="我的订单" />
      <main className="orders-page">
        <section className="orders-stats">
          <div>
            <strong>26</strong>
            <span>全部订单</span>
          </div>
          <div>
            <strong className="accent">8</strong>
            <span>竞猜获奖</span>
          </div>
          <div>
            <strong>12</strong>
            <span>直接购买</span>
          </div>
          <div>
            <strong>¥1,680</strong>
            <span>累计消费</span>
          </div>
        </section>

        <section className="orders-tabs">
          <button className="active" type="button">
            全部
          </button>
          <button type="button">待发货</button>
          <button type="button">已发货</button>
          <button type="button">已完成</button>
        </section>

        <div className="stack-list">
          {demoOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </main>
    </MobileShell>
  );
}
