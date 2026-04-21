'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiBaseUrl } from '../../lib/env';
import styles from './page.module.css';

type AddressTag = 'home' | 'work' | 'school' | '';

type AddressItem = {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  tag: AddressTag;
  isDefault: boolean;
};

type RegionMap = Record<string, Record<string, string[]>>;

const REGIONS: RegionMap = {
  北京市: { 北京市: ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区', '通州区', '大兴区'] },
  上海市: { 上海市: ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '浦东新区', '闵行区', '宝山区', '松江区'] },
  浙江省: { 杭州市: ['西湖区', '上城区', '拱墅区', '滨江区', '余杭区', '萧山区', '临平区', '钱塘区'], 宁波市: ['海曙区', '江北区', '鄞州区', '镇海区', '北仑区'], 温州市: ['鹿城区', '龙湾区', '瓯海区', '乐清市'] },
  广东省: { 广州市: ['天河区', '越秀区', '海珠区', '荔湾区', '白云区', '番禺区', '花都区', '南沙区'], 深圳市: ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区', '龙华区', '光明区'], 东莞市: ['南城街道', '东城街道', '莞城街道', '万江街道'] },
  江苏省: { 南京市: ['玄武区', '秦淮区', '建邺区', '鼓楼区', '栖霞区', '江宁区'], 苏州市: ['姑苏区', '吴中区', '相城区', '吴江区', '虎丘区', '工业园区'] },
  四川省: { 成都市: ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '高新区', '天府新区'] },
  湖北省: { 武汉市: ['武昌区', '洪山区', '江汉区', '汉阳区', '江岸区', '青山区', '东湖高新区'] },
  福建省: { 福州市: ['鼓楼区', '台江区', '仓山区', '晋安区', '马尾区'], 厦门市: ['思明区', '湖里区', '海沧区', '集美区', '翔安区'] },
  湖南省: { 长沙市: ['岳麓区', '芙蓉区', '天心区', '开福区', '雨花区', '望城区'] },
  山东省: { 济南市: ['历下区', '市中区', '槐荫区', '天桥区', '历城区', '长清区'], 青岛市: ['市南区', '市北区', '崂山区', '李沧区', '城阳区', '黄岛区'] },
};

function getAuthToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem('umi_token') ?? '';
}

async function requestAddress(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.code !== 0) {
    throw new Error(payload?.message || 'request failed');
  }
  return payload.data;
}

function normalizeAddress(item: any): AddressItem {
  return {
    id: String(item.id),
    name: item.name || '',
    phone: item.phone || '',
    province: item.province || '',
    city: item.city || '',
    district: item.district || '',
    detail: item.detail || '',
    tag: item.tag === 'home' || item.tag === 'work' || item.tag === 'school' ? item.tag : '',
    isDefault: Boolean(item.isDefault),
  };
}

function tagMeta(tag: AddressTag) {
  if (tag === 'home') {
    return { label: '家', icon: 'fa-solid fa-house', cls: styles.home };
  }
  if (tag === 'work') {
    return { label: '公司', icon: 'fa-solid fa-briefcase', cls: styles.work };
  }
  if (tag === 'school') {
    return { label: '学校', icon: 'fa-solid fa-graduation-cap', cls: styles.school };
  }
  return null;
}

export default function AddressPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    tag: '' as AddressTag,
    isDefault: false,
  });

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const result = await requestAddress('/api/addresses');
        if (!ignore) {
          const items = Array.isArray(result) ? result : [];
          setAddresses(items.map(normalizeAddress));
          setLoadError('');
        }
      } catch (error) {
        if (!ignore) {
          setAddresses([]);
          setLoadError(error instanceof Error ? error.message : '地址加载失败，请稍后重试');
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const empty = !loadError && addresses.length === 0;
  const provinces = useMemo(() => Object.keys(REGIONS), []);
  const cities = useMemo(() => (form.province ? Object.keys(REGIONS[form.province] || {}) : []), [form.province]);
  const districts = useMemo(() => {
    if (!form.province || !form.city) {
      return [];
    }
    return REGIONS[form.province]?.[form.city] || [];
  }, [form.city, form.province]);

  function resetForm() {
    setForm({
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      tag: '',
      isDefault: false,
    });
  }

  function openForm(id?: string) {
    setEditId(id || null);
    if (id) {
      const target = addresses.find((item) => item.id === id);
      if (target) {
        setForm({
          name: target.name,
          phone: target.phone,
          province: target.province,
          city: target.city,
          district: target.district,
          detail: target.detail,
          tag: target.tag,
          isDefault: target.isDefault,
        });
      }
    } else {
      resetForm();
    }
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditId(null);
    resetForm();
  }

  async function saveAddress() {
    if (!form.name.trim() || !form.phone.trim() || !form.province || !form.city || !form.district || !form.detail.trim()) {
      setToast('请填写完整地址信息');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      province: form.province,
      city: form.city,
      district: form.district,
      detail: form.detail.trim(),
      tag: form.tag || null,
      isDefault: form.isDefault,
    };

    try {
      if (editId) {
        const updated = await requestAddress(`/api/addresses/${encodeURIComponent(editId)}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setAddresses((current) => current.map((item) => (
          item.id === editId
            ? { ...normalizeAddress(updated), tag: form.tag }
            : form.isDefault ? { ...item, isDefault: false } : item
        )));
      } else {
        const created = await requestAddress('/api/addresses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const next = { ...normalizeAddress(created), tag: form.tag };
        setAddresses((current) => {
          const base = form.isDefault ? current.map((item) => ({ ...item, isDefault: false })) : current;
          return [next, ...base];
        });
      }
      closeForm();
      setToast('地址已保存');
    } catch (error) {
      setToast(error instanceof Error ? error.message : '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  }

  async function setDefault(id: string) {
    const target = addresses.find((item) => item.id === id);
    if (!target || target.isDefault) {
      return;
    }

    try {
      await requestAddress(`/api/addresses/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: target.name,
          phone: target.phone,
          province: target.province,
          city: target.city,
          district: target.district,
          detail: target.detail,
          tag: target.tag || null,
          isDefault: true,
        }),
      });
      setAddresses((current) => current.map((item) => ({ ...item, isDefault: item.id === id })));
      setToast('已设为默认地址');
    } catch (error) {
      setToast(error instanceof Error ? error.message : '设置失败，请稍后重试');
    }
  }

  async function confirmDelete() {
    if (!deleteId) {
      return;
    }

    try {
      await requestAddress(`/api/addresses/${encodeURIComponent(deleteId)}`, { method: 'DELETE' });
      setAddresses((current) => current.filter((item) => item.id !== deleteId));
      setToast('地址已删除');
    } catch (error) {
      setToast(error instanceof Error ? error.message : '删除失败，请稍后重试');
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>收货地址</div>
        <div className={styles.headerSpacer} />
      </header>

      {loadError ? (
        <section className={styles.errorState}>
          <div className={styles.errorIcon}><i className="fa-solid fa-circle-exclamation" /></div>
          <div className={styles.errorTitle}>收货地址加载失败</div>
          <div className={styles.errorText}>{loadError}</div>
          <button className={styles.errorBtn} type="button" onClick={() => setReloadToken((value) => value + 1)}>
            重试
          </button>
        </section>
      ) : empty ? (
        <section className={styles.empty}>
          <div className={styles.emptyIcon}><i className="fa-solid fa-location-dot" /></div>
          <div className={styles.emptyText}>还没有收货地址<br />添加一个地址，购物更方便</div>
          <button className={styles.emptyBtn} type="button" onClick={() => openForm()}>
            <i className="fa-solid fa-plus" />
            新增地址
          </button>
        </section>
      ) : (
        <section className={styles.list}>
          {addresses.map((item) => {
            const meta = tagMeta(item.tag);

            return (
              <article key={item.id} className={`${styles.card} ${item.isDefault ? styles.cardDefault : ''}`} onClick={() => openForm(item.id)}>
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
                  <button className={`${styles.setDefault} ${item.isDefault ? styles.setDefaultOn : ''}`} type="button" onClick={() => void setDefault(item.id)}>
                    <i className={item.isDefault ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle-check'} />
                    {item.isDefault ? '默认地址' : '设为默认'}
                  </button>
                  <button className={styles.action} type="button" onClick={() => openForm(item.id)}>
                    <i className="fa-solid fa-pen" /> 编辑
                  </button>
                  <button className={`${styles.action} ${styles.del}`} type="button" onClick={() => setDeleteId(item.id)}>
                    <i className="fa-solid fa-trash-can" /> 删除
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <div className={styles.bottomBar}>
        <button className={styles.addBtn} type="button" onClick={() => openForm()}>
          <i className="fa-solid fa-plus" />
          新增收货地址
        </button>
      </div>

      {formOpen ? (
        <div className={styles.overlay} onClick={(event) => event.target === event.currentTarget && closeForm()}>
          <div className={styles.sheet}>
            <div className={styles.sheetHd}>
              <div className={styles.sheetTitle}>{editId ? '编辑地址' : '新增地址'}</div>
              <button className={styles.closeBtn} type="button" onClick={closeForm}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.sheetBody}>
              <div className={styles.formRow}>
                <label className={styles.formGroup}>
                  <span className={styles.formLabel}><i>*</i> 收货人</span>
                  <input className={styles.formInput} maxLength={20} placeholder="姓名" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label className={styles.formGroup}>
                  <span className={styles.formLabel}><i>*</i> 手机号码</span>
                  <input className={styles.formInput} maxLength={11} placeholder="11位手机号" type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                </label>
              </div>

              <label className={styles.formGroup}>
                <span className={styles.formLabel}><i>*</i> 所在地区</span>
                <div className={styles.regionPicker}>
                  <select className={styles.regionSelect} value={form.province} onChange={(event) => setForm((current) => ({ ...current, province: event.target.value, city: '', district: '' }))}>
                    <option value="">省份</option>
                    {provinces.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  <select className={styles.regionSelect} value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value, district: '' }))}>
                    <option value="">城市</option>
                    {cities.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  <select className={styles.regionSelect} value={form.district} onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))}>
                    <option value="">区/县</option>
                    {districts.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </label>

              <label className={styles.formGroup}>
                <span className={styles.formLabel}><i>*</i> 详细地址</span>
                <textarea className={`${styles.formInput} ${styles.formTextarea}`} maxLength={120} placeholder="街道、门牌号、小区、楼栋等" value={form.detail} onChange={(event) => setForm((current) => ({ ...current, detail: event.target.value }))} />
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
                      onClick={() => setForm((current) => ({ ...current, tag: current.tag === tag.key ? '' : (tag.key as AddressTag) }))}
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
                <button className={`${styles.toggle} ${form.isDefault ? styles.toggleOn : ''}`} type="button" onClick={() => setForm((current) => ({ ...current, isDefault: !current.isDefault }))}>
                  <span />
                </button>
              </div>

              <button className={styles.sheetSubmit} disabled={saving} type="button" onClick={() => void saveAddress()}>
                保存地址
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteId ? (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmCard}>
            <div className={styles.confirmBody}>
              <div className={styles.confirmIcon}>🗑️</div>
              <div className={styles.confirmTitle}>确认删除此地址？</div>
              <div className={styles.confirmDesc}>删除后无法恢复</div>
            </div>
            <div className={styles.confirmBtns}>
              <button className={styles.confirmBtn} type="button" onClick={() => setDeleteId(null)}>
                取消
              </button>
              <button className={styles.confirmBtnDanger} type="button" onClick={() => void confirmDelete()}>
                删除
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
