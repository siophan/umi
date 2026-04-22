'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createAddress, deleteAddress, fetchAddresses, updateAddress } from '../../lib/api/address';
import { AddressFormModal } from './address-form-modal';
import { AddressList } from './address-list';
import { normalizeAddress, type AddressItem, type AddressTag } from './address-helpers';
import styles from './page.module.css';

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

function createEmptyForm(): AddressFormState {
  return {
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    tag: '',
    isDefault: false,
  };
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
  const [form, setForm] = useState<AddressFormState>(createEmptyForm);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const result = await fetchAddresses();
        if (!ignore) {
          const items = Array.isArray(result) ? result : [];
          setAddresses(items.map((item) => normalizeAddress({ ...item, id: item.id })));
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

  function resetForm() {
    setForm(createEmptyForm());
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
        const updated = await updateAddress(editId, payload);
        setAddresses((current) =>
          current.map((item) =>
            item.id === editId
              ? { ...normalizeAddress({ ...updated, id: updated.id }), tag: form.tag }
              : form.isDefault
                ? { ...item, isDefault: false }
                : item,
          ),
        );
      } else {
        const created = await createAddress(payload);
        const next = { ...normalizeAddress({ ...created, id: created.id }), tag: form.tag };
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
      await updateAddress(id, {
        name: target.name,
        phone: target.phone,
        province: target.province,
        city: target.city,
        district: target.district,
        detail: target.detail,
        tag: target.tag || null,
        isDefault: true,
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
      await deleteAddress(deleteId);
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

      <AddressList
        loadError={loadError}
        empty={empty}
        addresses={addresses}
        onRetry={() => setReloadToken((value) => value + 1)}
        onCreate={() => openForm()}
        onEdit={openForm}
        onSetDefault={(id) => void setDefault(id)}
        onDelete={setDeleteId}
      />

      <div className={styles.bottomBar}>
        <button className={styles.addBtn} type="button" onClick={() => openForm()}>
          <i className="fa-solid fa-plus" />
          新增收货地址
        </button>
      </div>

      {formOpen ? (
        <AddressFormModal
          editId={editId}
          form={form}
          saving={saving}
          onClose={closeForm}
          onChange={(updater) => setForm((current) => updater(current))}
          onSubmit={() => void saveAddress()}
        />
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
