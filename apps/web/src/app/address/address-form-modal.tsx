'use client';

import styles from './page.module.css';
import { REGIONS, type AddressTag } from './address-helpers';

type AddressFormState = {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  tag: AddressTag;
  isDefault: boolean;
};

type AddressFormModalProps = {
  editId: string | null;
  form: AddressFormState;
  saving: boolean;
  onClose: () => void;
  onChange: (updater: (current: AddressFormState) => AddressFormState) => void;
  onSubmit: () => void;
};

export function AddressFormModal({
  editId,
  form,
  saving,
  onClose,
  onChange,
  onSubmit,
}: AddressFormModalProps) {
  const provinces = Object.keys(REGIONS);
  const cities = form.province ? Object.keys(REGIONS[form.province] || {}) : [];
  const districts = form.province && form.city ? REGIONS[form.province]?.[form.city] || [] : [];

  return (
    <div className={styles.overlay} onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className={styles.sheet}>
        <div className={styles.sheetHd}>
          <div className={styles.sheetTitle}>{editId ? '编辑地址' : '新增地址'}</div>
          <button className={styles.closeBtn} type="button" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className={styles.sheetBody}>
          <div className={styles.formRow}>
            <label className={styles.formGroup}>
              <span className={styles.formLabel}><i>*</i> 收货人</span>
              <input className={styles.formInput} maxLength={20} placeholder="姓名" value={form.name} onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className={styles.formGroup}>
              <span className={styles.formLabel}><i>*</i> 手机号码</span>
              <input className={styles.formInput} maxLength={11} placeholder="11位手机号" type="tel" value={form.phone} onChange={(event) => onChange((current) => ({ ...current, phone: event.target.value }))} />
            </label>
          </div>

          <label className={styles.formGroup}>
            <span className={styles.formLabel}><i>*</i> 所在地区</span>
            <div className={styles.regionPicker}>
              <select className={styles.regionSelect} value={form.province} onChange={(event) => onChange((current) => ({ ...current, province: event.target.value, city: '', district: '' }))}>
                <option value="">省份</option>
                {provinces.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <select className={styles.regionSelect} value={form.city} onChange={(event) => onChange((current) => ({ ...current, city: event.target.value, district: '' }))}>
                <option value="">城市</option>
                {cities.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <select className={styles.regionSelect} value={form.district} onChange={(event) => onChange((current) => ({ ...current, district: event.target.value }))}>
                <option value="">区/县</option>
                {districts.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </label>

          <label className={styles.formGroup}>
            <span className={styles.formLabel}><i>*</i> 详细地址</span>
            <textarea className={`${styles.formInput} ${styles.formTextarea}`} maxLength={120} placeholder="街道、门牌号、小区、楼栋等" value={form.detail} onChange={(event) => onChange((current) => ({ ...current, detail: event.target.value }))} />
          </label>

          <div className={styles.formGroup}>
            <span className={styles.formLabel}>标签</span>
            <div className={styles.tagRow}>
              {[
                { key: 'home', label: '家', icon: 'fa-solid fa-house' },
                { key: 'work', label: '公司', icon: 'fa-solid fa-briefcase' },
                { key: 'school', label: '学校', icon: 'fa-solid fa-graduation-cap' },
              ].map((tag) => (
                <button
                  key={tag.key}
                  className={`${styles.tagChip} ${form.tag === tag.key ? styles.tagActive : ''}`}
                  type="button"
                  onClick={() => onChange((current) => ({ ...current, tag: current.tag === tag.key ? '' : (tag.key as AddressTag) }))}
                >
                  <i className={tag.icon} /> {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.defaultRow}>
            <div>
              <div className={styles.defaultText}>设为默认地址</div>
              <div className={styles.defaultSub}>每次下单时会自动使用</div>
            </div>
            <button className={`${styles.toggle} ${form.isDefault ? styles.toggleOn : ''}`} type="button" onClick={() => onChange((current) => ({ ...current, isDefault: !current.isDefault }))}>
              <span />
            </button>
          </div>

          <button className={styles.sheetSubmit} disabled={saving} type="button" onClick={onSubmit}>
            保存地址
          </button>
        </div>
      </div>
    </div>
  );
}
