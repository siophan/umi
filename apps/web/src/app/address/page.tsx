"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type AddressItem = {
  id: string;
  name: string;
  phone: string;
  region: string;
  detail: string;
  tag: "home" | "work" | "school";
  default: boolean;
};

const initialAddresses: AddressItem[] = [
  { id: "1", name: "张先生", phone: "138****8822", region: "上海市 浦东新区", detail: "张江高科 12 号楼 908", tag: "home", default: true },
  { id: "2", name: "李女士", phone: "139****6618", region: "上海市 黄浦区", detail: "南京东路 188 号 22 楼", tag: "work", default: false },
];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m14.5 5.5-1.06-1.06L6.88 11H20v1.5H6.88l6.56 6.56 1.06-1.06L8.75 12l5.75-6.5Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6.8 5.4 5.2 5.2 5.2-5.2 1.4 1.4-5.2 5.2 5.2 5.2-1.4 1.4-5.2-5.2-5.2 5.2-1.4-1.4 5.2-5.2-5.2-5.2 1.4-1.4Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" />
    </svg>
  );
}

export default function AddressPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [manageMode, setManageMode] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("新增地址");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    province: "",
    city: "",
    district: "",
    detail: "",
    tag: "home" as AddressItem["tag"],
    default: false,
  });

  const empty = addresses.length === 0;
  const regionList = useMemo(
    () => ["北京市", "上海市", "浙江省", "广东省", "江苏省", "四川省"],
    [],
  );

  const openToast = (message: string) => setToast(message);

  const openForm = (title = "新增地址") => {
    setFormTitle(title);
    setFormOpen(true);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <ArrowIcon />
        </button>
        <div className={styles.title}>收货地址</div>
        <button className={styles.manageBtn} type="button" onClick={() => setManageMode((v) => !v)}>
          {manageMode ? "完成" : "管理"}
        </button>
      </header>

      {empty ? (
        <section className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <div className={styles.emptyText}>还没有收货地址</div>
          <button className={styles.emptyBtn} type="button" onClick={() => openForm()}>
            <PlusIcon />
            新增收货地址
          </button>
        </section>
      ) : (
        <section className={styles.list}>
          {addresses.map((item) => (
            <article key={item.id} className={`${styles.card} ${item.default ? styles.cardDefault : ""}`}>
              <div className={styles.cardTop}>
                <div className={styles.name}>{item.name}</div>
                <div className={styles.phone}>{item.phone}</div>
                {item.default && <div className={styles.defaultTag}>默认</div>}
              </div>
              <div className={styles.detail}>
                <span className={`${styles.label} ${styles[item.tag]}`}>{item.tag === "home" ? "家" : item.tag === "work" ? "公司" : "学校"}</span>
                {item.region} {item.detail}
              </div>
              <div className={styles.cardBottom}>
                <button
                  className={`${styles.setDefault} ${item.default ? styles.setDefaultOn : ""}`}
                  type="button"
                  onClick={() => {
                    setAddresses((prev) => prev.map((addr) => ({ ...addr, default: addr.id === item.id })));
                    openToast("已设为默认地址");
                  }}
                >
                  <span className={styles.radio}>◉</span>
                  设为默认地址
                </button>
                <button className={styles.action} type="button" onClick={() => openForm("编辑地址")}>
                  编辑
                </button>
                <button className={`${styles.action} ${styles.del}`} type="button" onClick={() => setDeleteId(item.id)}>
                  删除
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <div className={styles.bottomBar}>
        <button className={styles.addBtn} type="button" onClick={() => openForm()}>
          <PlusIcon />
          新增收货地址
        </button>
      </div>

      {formOpen && (
        <div className={styles.overlay} onClick={(event) => event.target === event.currentTarget && setFormOpen(false)}>
          <div className={styles.sheet}>
            <div className={styles.sheetHd}>
              <div className={styles.sheetTitle}>{formTitle}</div>
              <button className={styles.closeBtn} type="button" onClick={() => setFormOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className={styles.sheetBody}>
              <div className={styles.formRow}>
                <label className={styles.formGroup}>
                  <span className={styles.formLabel}><i>*</i> 收货人</span>
                  <input className={styles.formInput} value={form.name} placeholder="姓名" onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </label>
                <label className={styles.formGroup}>
                  <span className={styles.formLabel}><i>*</i> 手机号码</span>
                  <input className={styles.formInput} value={form.phone} placeholder="11位手机号" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </label>
              </div>
              <label className={styles.formGroup}>
                <span className={styles.formLabel}><i>*</i> 所在地区</span>
                <div className={styles.regionPicker}>
                  <select className={styles.regionSelect} value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}>
                    <option value="">省份</option>
                    {regionList.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                  <select className={styles.regionSelect} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                    <option value="">城市</option>
                  </select>
                  <select className={styles.regionSelect} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
                    <option value="">区/县</option>
                  </select>
                </div>
              </label>
              <label className={styles.formGroup}>
                <span className={styles.formLabel}><i>*</i> 详细地址</span>
                <textarea className={`${styles.formInput} ${styles.formTextarea}`} value={form.detail} placeholder="街道、门牌号、小区、楼栋等" onChange={(e) => setForm({ ...form, detail: e.target.value })} />
              </label>
              <div className={styles.formGroup}>
                <span className={styles.formLabel}>标签</span>
                <div className={styles.tagRow}>
                  {[
                    { key: "home", label: "家", icon: "🏠" },
                    { key: "work", label: "公司", icon: "💼" },
                    { key: "school", label: "学校", icon: "🎓" },
                  ].map((tag) => (
                    <button
                      key={tag.key}
                      type="button"
                      className={`${styles.tagChip} ${form.tag === tag.key ? styles.tagActive : ""}`}
                      onClick={() => setForm({ ...form, tag: tag.key as AddressItem["tag"] })}
                    >
                      {tag.icon} {tag.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.defaultRow}>
                <div>
                  <div className={styles.defaultText}>设为默认地址</div>
                  <div className={styles.defaultSub}>每次下单时会自动使用</div>
                </div>
                <button className={`${styles.toggle} ${form.default ? styles.toggleOn : ""}`} type="button" onClick={() => setForm({ ...form, default: !form.default })}>
                  <span />
                </button>
              </div>
              <button className={styles.sheetSubmit} type="button" onClick={() => openToast("地址已保存")}>
                保存地址
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
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
              <button
                className={styles.confirmBtnDanger}
                type="button"
                onClick={() => {
                  setAddresses((prev) => prev.filter((addr) => addr.id !== deleteId));
                  setDeleteId(null);
                  openToast("地址已删除");
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
    </main>
  );
}
