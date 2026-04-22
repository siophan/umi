'use client';

import type { CartItem as CartLineItem } from '@umi/shared';

import styles from './page.module.css';

type CartFooterBarProps = {
  editMode: boolean;
  allChecked: boolean;
  selectedItems: CartLineItem[];
  total: number;
  totalSaved: number;
  totalCount: number;
  onToggleAll: () => Promise<void>;
  onBulkRemove: () => Promise<void>;
  onPay: () => void;
};

export function CartFooterBar({
  editMode,
  allChecked,
  selectedItems,
  total,
  totalSaved,
  totalCount,
  onToggleAll,
  onBulkRemove,
  onPay,
}: CartFooterBarProps) {
  return (
    <footer className={styles.bar}>
      <div className={styles.barLeft}>
        <button className={styles.barAll} type="button" onClick={() => void onToggleAll()}>
          <span className={`${styles.check} ${allChecked ? styles.checkOn : ''}`}>
            <i className="fa-solid fa-check" />
          </span>
          <span>全选</span>
        </button>
      </div>
      <div className={styles.barSpacer} />
      {editMode ? (
        <div className={styles.barEditSummary}>已选 {selectedItems.length} 件</div>
      ) : (
        <div className={styles.barTotal}>
          <div className={styles.barTotalLabel}>合计</div>
          <div className={styles.barTotalPrice}>
            <small>¥</small>
            {total.toFixed(1)}
          </div>
          <div className={styles.barSaved}>{totalSaved > 0 ? `已省 ¥${totalSaved.toFixed(1)}` : ''}</div>
        </div>
      )}
      <button
        className={`${styles.barBtn} ${editMode ? styles.barBtnDanger : ''} ${(editMode ? selectedItems.length === 0 : totalCount === 0) ? styles.barBtnDisabled : ''}`}
        type="button"
        onClick={editMode ? () => void onBulkRemove() : onPay}
      >
        {editMode ? `删除(${selectedItems.length})` : `结算(${totalCount})`}
      </button>
    </footer>
  );
}

