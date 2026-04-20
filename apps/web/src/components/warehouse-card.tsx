import type { WarehouseItem } from '@umi/shared';

export function WarehouseCard({ item }: { item: WarehouseItem }) {
  return (
    <article className="warehouse-card">
      <div className="warehouse-card__thumb">{item.warehouseType === 'virtual' ? '虚' : '实'}</div>
      <div className="warehouse-card__info">
        <h3>{item.productName}</h3>
        <p>
          {item.warehouseType} · {item.sourceType} · x{item.quantity}
        </p>
        <span className={`warehouse-card__status status-${item.status}`}>{item.status}</span>
      </div>
      <div className="warehouse-card__actions">
        <button className="accent" type="button">
          {item.warehouseType === 'virtual' ? '转实体' : '查看物流'}
        </button>
        <button type="button">寄售</button>
      </div>
    </article>
  );
}
