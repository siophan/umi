'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserAddressItem, WarehouseItem } from '@umi/shared';

import { fetchAddresses } from '../../lib/api/address';
import styles from './page.module.css';

type WarehouseShipModalProps = {
  item: WarehouseItem;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (addressId: string) => void;
};

export function WarehouseShipModal({ item, submitting, onClose, onSubmit }: WarehouseShipModalProps) {
  const router = useRouter();
  const [addresses, setAddresses] = useState<UserAddressItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    fetchAddresses()
      .then((items) => {
        if (ignore) return;
        setAddresses(items);
        const def = items.find((a) => a.isDefault) ?? items[0];
        setSelectedId(def ? def.id : '');
      })
      .catch((err) => {
        if (ignore) return;
        setError(err instanceof Error ? err.message : '收货地址加载失败');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const canSubmit = !submitting && Boolean(selectedId);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.sellHead}>
          <div className={styles.sellTitle}>选择收货地址</div>
          <button className={styles.close} type="button" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className={styles.sellProduct}>
          <img src={item.productImg || '/legacy/images/products/p001-lays.jpg'} alt={item.productName} />
          <div className={styles.sellProductInfo}>
            <div className={styles.sellProductName}>{item.productName}</div>
            <div className={styles.sellProductMeta}>×{item.quantity} · 提货后由商家发货</div>
          </div>
        </div>

        {loading ? (
          <div className={styles.shipPlaceholder}>
            <div className={styles.shipPlaceholderText}>正在加载收货地址...</div>
          </div>
        ) : error ? (
          <div className={styles.shipPlaceholder}>
            <div className={styles.shipPlaceholderText}>{error}</div>
          </div>
        ) : addresses.length === 0 ? (
          <div className={styles.shipPlaceholder}>
            <div className={styles.shipPlaceholderTitle}>还没有收货地址</div>
            <div className={styles.shipPlaceholderText}>请先添加一个地址再提货</div>
            <button
              className={styles.shipAddAddress}
              type="button"
              onClick={() => router.push('/address')}
            >
              + 新增收货地址
            </button>
          </div>
        ) : (
          <div className={styles.shipAddressList}>
            {addresses.map((address) => {
              const isActive = selectedId === address.id;
              return (
                <button
                  key={address.id}
                  type="button"
                  className={`${styles.shipAddressItem} ${isActive ? styles.shipAddressActive : ''}`}
                  onClick={() => setSelectedId(address.id)}
                >
                  <div className={styles.shipAddressTop}>
                    <span className={styles.shipAddressName}>{address.name}</span>
                    <span className={styles.shipAddressPhone}>{address.phone}</span>
                    {address.isDefault ? <span className={styles.shipAddressTag}>默认</span> : null}
                  </div>
                  <div className={styles.shipAddressDetail}>
                    {address.province}
                    {address.city}
                    {address.district}
                    {address.detail}
                  </div>
                </button>
              );
            })}
            <button
              className={styles.shipManageAddress}
              type="button"
              onClick={() => router.push('/address')}
            >
              + 管理收货地址
            </button>
          </div>
        )}

        <button
          className={styles.submit}
          type="button"
          disabled={!canSubmit}
          style={!canSubmit ? { opacity: 0.5 } : undefined}
          onClick={() => {
            if (!canSubmit) return;
            onSubmit(selectedId);
          }}
        >
          {submitting ? '提交中...' : '确认提货'}
        </button>
      </div>
    </div>
  );
}
