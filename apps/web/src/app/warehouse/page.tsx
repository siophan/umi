import { MobileShell } from '../../components/mobile-shell';
import { PageHeader } from '../../components/page-header';
import { WarehouseCard } from '../../components/warehouse-card';
import { demoWarehouse } from '../../lib/demo';

export default function WarehousePage() {
  return (
    <MobileShell tab="warehouse">
      <PageHeader title="我的仓库" />
      <main className="warehouse-page">
        <section className="warehouse-summary">
          <div className="warehouse-summary__grid">
            <div className="summary-card pending">
              <strong>2</strong>
              <span>待提货</span>
            </div>
            <div className="summary-card shipped">
              <strong>1</strong>
              <span>运输中</span>
            </div>
            <div className="summary-card delivered">
              <strong>3</strong>
              <span>已签收</span>
            </div>
            <div className="summary-card consigning">
              <strong>1</strong>
              <span>寄售中</span>
            </div>
          </div>
          <div className="warehouse-summary__total">
            <span>物资总值</span>
            <strong>¥958.0</strong>
          </div>
        </section>

        <section className="warehouse-tabs">
          <button className="active" type="button">
            全部
          </button>
          <button type="button">待提货</button>
          <button type="button">运输中</button>
          <button type="button">已签收</button>
          <button type="button">寄售中</button>
        </section>

        <div className="stack-list">
          {demoWarehouse.map((item) => (
            <WarehouseCard item={item} key={item.id} />
          ))}
        </div>
      </main>
    </MobileShell>
  );
}
