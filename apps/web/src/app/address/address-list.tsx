'use client';

import styles from './page.module.css';
import { tagMeta, type AddressItem } from './address-helpers';

type AddressListProps = {
  loadError: string;
  empty: boolean;
  addresses: AddressItem[];
  onRetry: () => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
};

export function AddressList({
  loadError,
  empty,
  addresses,
  onRetry,
  onCreate,
  onEdit,
  onSetDefault,
  onDelete,
}: AddressListProps) {
  if (loadError) {
    return (
      <section className={styles.errorState}>
        <div className={styles.errorIcon}><i className="fa-solid fa-circle-exclamation" /></div>
        <div className={styles.errorTitle}>收货地址加载失败</div>
        <div className={styles.errorText}>{loadError}</div>
        <button className={styles.errorBtn} type="button" onClick={onRetry}>
          重试
        </button>
      </section>
    );
  }

  if (empty) {
    return (
      <section className={styles.empty}>
        <div className={styles.emptyIcon}><i className="fa-solid fa-location-dot" /></div>
        <div className={styles.emptyText}>还没有收货地址<br />添加一个地址，购物更方便</div>
        <button className={styles.emptyBtn} type="button" onClick={onCreate}>
          <i className="fa-solid fa-plus" />
          新增地址
        </button>
      </section>
    );
  }

  return (
    <section className={styles.list}>
      {addresses.map((item) => {
        const meta = tagMeta(item.tag);

        return (
          <article key={item.id} className={`${styles.card} ${item.isDefault ? styles.cardDefault : ''}`} onClick={() => onEdit(item.id)}>
            <div className={styles.cardTop}>
              <div className={styles.name}>{item.name}</div>
              <div className={styles.phone}>{item.phone}</div>
              {item.isDefault ? <div className={styles.defaultTag}>默认</div> : null}
            </div>
            <div className={styles.detail}>
              {meta ? (
                <span className={`${styles.label} ${meta.cls}`}>
                  <i className={meta.icon} /> {meta.label}
                </span>
              ) : null}
              {item.province} {item.city} {item.district}
              <br />
              {item.detail}
            </div>
            <div className={styles.cardBottom} onClick={(event) => event.stopPropagation()}>
              <button className={`${styles.setDefault} ${item.isDefault ? styles.setDefaultOn : ''}`} type="button" onClick={() => onSetDefault(item.id)}>
                <i className={item.isDefault ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle-check'} />
                {item.isDefault ? '默认地址' : '设为默认'}
              </button>
              <button className={styles.action} type="button" onClick={() => onEdit(item.id)}>
                <i className="fa-solid fa-pen" /> 编辑
              </button>
              <button className={`${styles.action} ${styles.del}`} type="button" onClick={() => onDelete(item.id)}>
                <i className="fa-solid fa-trash-can" /> 删除
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
