'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import styles from './page.module.css';

type TemplateId = 'pk' | 'duel' | 'multi' | 'number';

const templates: Array<{
  id: TemplateId;
  icon: string;
  name: string;
  desc: string;
  merchantOnly?: boolean;
}> = [
  { id: 'pk', icon: '⚔️', name: '好友PK', desc: '仅限好友对战' },
  { id: 'duel', icon: '🎯', name: '二选一', desc: '支持关联商品', merchantOnly: true },
  { id: 'multi', icon: '🧩', name: '多选竞猜', desc: '适合投票玩法', merchantOnly: true },
  { id: 'number', icon: '📈', name: '数值预测', desc: '比分/销量竞猜', merchantOnly: true },
];

const initialOptions = ['阿根廷卫冕', '法国夺冠'];

const friends = [
  { id: 'f1', name: '小米', avatar: '/legacy/images/mascot/mouse-main.png', online: true },
  { id: 'f2', name: '阿星', avatar: '/legacy/images/mascot/mouse-happy.png', online: true },
  { id: 'f3', name: '雨桐', avatar: '/legacy/images/mascot/mouse-casual.png', online: false },
  { id: 'f4', name: '零食猎人', avatar: '/legacy/images/products/p007-dove.jpg', online: true },
];

const products = [
  {
    id: 'p001',
    name: '乐事原味薯片大礼包',
    brand: '乐事官方旗舰店',
    price: 49.9,
    originalPrice: 69.9,
    sales: '1.2万',
    rating: '4.9',
    stock: 182,
    img: '/legacy/images/products/p001-lays.jpg',
  },
  {
    id: 'p002',
    name: '奥利奥夹心零食礼盒',
    brand: '奥利奥品牌馆',
    price: 39.9,
    originalPrice: 52.9,
    sales: '8.6k',
    rating: '4.8',
    stock: 95,
    img: '/legacy/images/products/p002-oreo.jpg',
  },
];

export default function CreatePage() {
  const router = useRouter();
  const [isMerchantMode] = useState(false);
  const [template, setTemplate] = useState<TemplateId>('pk');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState('');
  const [options, setOptions] = useState(initialOptions);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  const [couponEnabled, setCouponEnabled] = useState(true);
  const [couponType, setCouponType] = useState<'full_reduce' | 'discount' | 'no_threshold'>('full_reduce');
  const [couponThreshold, setCouponThreshold] = useState('50');
  const [couponAmount, setCouponAmount] = useState('5');
  const [couponDiscount, setCouponDiscount] = useState('8.5');
  const [couponMaxOff, setCouponMaxOff] = useState('12');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishToast, setPublishToast] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState(0);

  const steps = useMemo(() => {
    const step0 = !!template;
    const step1 = title.trim().length >= 5;
    const step2 = options.filter((item) => item.trim()).length >= 2;
    const step3 = !!deadline;
    return [step0, step1, step2, step3];
  }, [deadline, options, template, title]);

  const progress = useMemo(() => Math.round((steps.filter(Boolean).length / 4) * 100), [steps]);

  const selectedCount = options.filter((item) => item.trim()).length;

  const previewCoupon = useMemo(() => {
    if (!couponEnabled) {
      return '未开启自动补偿券';
    }

    if (couponType === 'discount') {
      return `${couponDiscount}折，最高减${couponMaxOff}元`;
    }

    if (couponType === 'no_threshold') {
      return `无门槛立减${couponAmount}元`;
    }

    return `满${couponThreshold}元减${couponAmount}元`;
  }, [couponAmount, couponDiscount, couponEnabled, couponMaxOff, couponThreshold, couponType]);

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((item, idx) => (idx === index ? value : item)));
  }

  function addOption() {
    setOptions((current) => [...current, `选项 ${String.fromCharCode(65 + current.length)}`]);
  }

  function removeOption(index: number) {
    setOptions((current) => current.filter((_, idx) => idx !== index));
  }

  function toggleFriend(friendId: string) {
    setSelectedFriends((current) =>
      current.includes(friendId) ? current.filter((item) => item !== friendId) : [...current, friendId],
    );
  }

  function showToast(message: string) {
    setPublishToast(message);
    window.setTimeout(() => setPublishToast(''), 1800);
  }

  function handlePublish() {
    if (publishing) {
      return;
    }

    setPublishing(true);
    setPublishStep(0);

    const steps = [1, 2, 3];
    steps.forEach((step, index) => {
      window.setTimeout(() => {
        setPublishStep(step);
      }, 500 + index * 500);
    });

    window.setTimeout(() => {
      setPublishing(false);
      setPublishStep(3);
      showToast('竞猜创建成功！');
    }, 2200);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.headerTitle}>创建竞猜</div>
        <button className={styles.headerAction} type="button" onClick={() => setPreviewOpen(true)}>
          预览
        </button>
      </header>

      <div className={`${styles.roleBar} ${isMerchantMode ? styles.merchantMode : styles.userMode}`}>
        <span className={styles.roleIcon}>{isMerchantMode ? '🏪' : '👤'}</span>
        <span className={styles.roleText}>{isMerchantMode ? '商家模式' : '用户模式'}</span>
        {isMerchantMode ? <span className={styles.roleBadge}>PRO</span> : null}
        <span className={styles.roleDesc}>{isMerchantMode ? '可发布品牌竞猜和关联商品' : '仅限好友PK竞猜'}</span>
      </div>

      <div className={styles.formProgress}>
        <div className={styles.progressBar}>
          {steps.map((step, index) => (
            <div key={index} className={`${styles.progressSeg} ${step ? styles.progressSegDone : ''}`} />
          ))}
        </div>
        <div className={styles.progressInfo}>
          <span>创建进度</span>
          <span className={styles.progressPct}>{progress}%</span>
        </div>
      </div>

      <div className={styles.sectionHeader}>选择模板</div>
      <div className={styles.templateGrid}>
        {templates.map((item) => {
          const locked = item.merchantOnly && !isMerchantMode;
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.templateCard} ${template === item.id ? styles.templateSelected : ''} ${locked ? styles.templateLocked : ''}`}
              onClick={() => {
                if (!locked) {
                  setTemplate(item.id);
                }
              }}
            >
              <div className={styles.templateIcon}>{item.icon}</div>
              <div className={styles.templateName}>{item.name}</div>
              <div className={styles.templateDesc}>{item.desc}</div>
              {locked ? <div className={styles.templateMask}>🔒 开店解锁</div> : null}
            </button>
          );
        })}
      </div>

      {!isMerchantMode ? (
        <button className={styles.merchantHook} type="button" onClick={() => router.push('/brand-auth')}>
          <div className={styles.merchantHookIcon}>🏪</div>
          <div className={styles.merchantHookInfo}>
            <div className={styles.merchantHookTitle}>想要发布更多竞猜玩法？</div>
            <div className={styles.merchantHookDesc}>开通商家身份，解锁二选一、多选、数值预测等全模板 + 关联商品 + 自动优惠券</div>
          </div>
          <i className="fa-solid fa-chevron-right" />
        </button>
      ) : null}

      <section className={styles.formSection}>
        <h3>
          <span className={styles.stepNum}>1</span>
          基本信息
          <span className={`${styles.stepStatus} ${steps[1] ? styles.done : styles.pending}`}>{steps[1] ? '✓ 已完成' : '待完善'}</span>
        </h3>
        <div className={styles.field}>
          <label className={styles.label}>竞猜标题</label>
          <input
            className={styles.input}
            placeholder="例如：猜猜今年最火零食是什么？"
            maxLength={50}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          {!steps[1] ? <div className={styles.validationTip}><i className="fa-solid fa-circle-exclamation" /> 请输入竞猜标题（至少5个字）</div> : null}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>竞猜描述</label>
          <textarea
            className={styles.textarea}
            placeholder="描述一下竞猜规则和奖品..."
            value={desc}
            onChange={(event) => setDesc(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>封面图片</label>
          <button className={styles.coverUpload} type="button" onClick={() => showToast('选择封面')}>
            <div className={styles.coverPlaceholder}>
              <i className="fa-solid fa-image" />
              <span>上传竞猜封面</span>
            </div>
          </button>
        </div>
      </section>

      <section className={styles.formSection}>
        <h3>
          <span className={styles.stepNum}>2</span>
          竞猜选项
          <span className={styles.requiredMark}>*</span>
          <span className={`${styles.stepStatus} ${steps[2] ? styles.done : styles.pending}`}>{steps[2] ? `✓ ${selectedCount}个选项` : '待完善'}</span>
        </h3>
        <div className={styles.optionsList}>
          {options.map((item, index) => (
            <div className={styles.optionRow} key={`${index}-${item}`}>
              <input
                className={styles.input}
                value={item}
                placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                onChange={(event) => updateOption(index, event.target.value)}
              />
              {options.length > 2 ? (
                <button className={styles.removeBtn} type="button" onClick={() => removeOption(index)}>
                  <i className="fa-solid fa-circle-minus" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <button className={styles.addOptionBtn} type="button" onClick={addOption}>
          <i className="fa-solid fa-plus" /> 添加选项
        </button>
      </section>

      {template === 'pk' ? (
        <section className={styles.formSection}>
          <h3>
            <span className={styles.stepNum}>PK</span>
            好友邀请
            <span className={`${styles.stepStatus} ${selectedFriends.length ? styles.done : styles.pending}`}>{selectedFriends.length ? `已选 ${selectedFriends.length} 人` : '待选择'}</span>
          </h3>
          <div className={styles.friendsGrid}>
            {friends.map((friend) => {
              const active = selectedFriends.includes(friend.id);
              return (
                <button
                  key={friend.id}
                  type="button"
                  className={`${styles.friendCard} ${active ? styles.friendSelected : ''}`}
                  onClick={() => toggleFriend(friend.id)}
                >
                  <div className={styles.friendAvatarWrap}>
                    <img src={friend.avatar} alt={friend.name} />
                    {friend.online ? <span className={styles.friendOnline} /> : null}
                  </div>
                  <span>{friend.name}</span>
                </button>
              );
            })}
            <button className={styles.inviteMore} type="button" onClick={() => showToast('邀请更多好友')}>
              <div className={styles.inviteMoreIcon}>
                <i className="fa-solid fa-plus" />
              </div>
              <span>邀请</span>
            </button>
          </div>
        </section>
      ) : null}

      <section className={styles.formSection}>
        <h3>
          <span className={styles.stepNum}>3</span>
          开奖设置
          <span className={`${styles.stepStatus} ${steps[3] ? styles.done : styles.pending}`}>{steps[3] ? '✓ 已设置' : '待完善'}</span>
        </h3>

        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>开奖时间</div>
            <div className={styles.settingDesc}>竞猜结束后自动开奖</div>
          </div>
          <input
            className={styles.datetime}
            type="datetime-local"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />
        </div>

        <div className={`${styles.settingRow} ${!isMerchantMode ? styles.lockedFeature : ''}`}>
          <div>
            <div className={styles.settingLabel}>
              关联商品 {!isMerchantMode ? <span className={styles.lockedTag}>商家专属</span> : null}
            </div>
            <div className={styles.settingDesc}>可选一件商品作为竞猜奖品</div>
          </div>
          <button className={styles.linkBtn} type="button" onClick={() => showToast('选择关联商品')}>
            选择
          </button>
        </div>

        <div className={styles.selectedProduct}>
          <img src={selectedProduct.img} alt={selectedProduct.name} />
          <div className={styles.selectedProductInfo}>
            <div className={styles.selectedProductName}>{selectedProduct.name}</div>
            <div className={styles.selectedProductBrand}>{selectedProduct.brand}</div>
            <div className={styles.selectedProductMeta}>
              <span className={styles.selectedPrice}>¥{selectedProduct.price}</span>
              <span className={styles.selectedSales}>{selectedProduct.sales}已售</span>
              <span className={styles.selectedScore}>{selectedProduct.rating}分</span>
            </div>
          </div>
        </div>

        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>
              自动生成优惠券 {!isMerchantMode ? <span className={styles.lockedTag}>商家专属</span> : null}
            </div>
            <div className={styles.settingDesc}>未中者自动获得补偿券</div>
          </div>
          <button
            className={`${styles.toggle} ${couponEnabled ? styles.toggleActive : ''}`}
            type="button"
            onClick={() => setCouponEnabled((value) => !value)}
          >
            <span />
          </button>
        </div>

        {couponEnabled ? (
          <div className={styles.couponConfig}>
            <div className={styles.couponConfigTitle}>🏷️ 优惠券配置</div>
            <div className={styles.couponTypes}>
              <button type="button" className={`${styles.couponType} ${couponType === 'full_reduce' ? styles.couponTypeOn : ''}`} onClick={() => setCouponType('full_reduce')}>
                <div className={styles.couponTypeIcon}>💰</div>
                <div className={styles.couponTypeName}>满减券</div>
                <div className={styles.couponTypeDesc}>满X元减Y元</div>
              </button>
              <button type="button" className={`${styles.couponType} ${couponType === 'discount' ? styles.couponTypeOn : ''}`} onClick={() => setCouponType('discount')}>
                <div className={styles.couponTypeIcon}>🌟</div>
                <div className={styles.couponTypeName}>折扣券</div>
                <div className={styles.couponTypeDesc}>打X折优惠</div>
              </button>
              <button type="button" className={`${styles.couponType} ${couponType === 'no_threshold' ? styles.couponTypeOn : ''}`} onClick={() => setCouponType('no_threshold')}>
                <div className={styles.couponTypeIcon}>🎁</div>
                <div className={styles.couponTypeName}>无门槛券</div>
                <div className={styles.couponTypeDesc}>直接抵扣现金</div>
              </button>
            </div>

            {couponType === 'full_reduce' ? (
              <div className={styles.couponFields}>
                <label className={styles.couponField}>
                  <span>满足金额</span>
                  <input type="number" value={couponThreshold} onChange={(event) => setCouponThreshold(event.target.value)} />
                  <small>元</small>
                </label>
                <label className={styles.couponField}>
                  <span>减免金额</span>
                  <input type="number" value={couponAmount} onChange={(event) => setCouponAmount(event.target.value)} />
                  <small>元</small>
                </label>
              </div>
            ) : null}

            {couponType === 'discount' ? (
              <div className={styles.couponFields}>
                <label className={styles.couponField}>
                  <span>折扣力度</span>
                  <input type="number" value={couponDiscount} onChange={(event) => setCouponDiscount(event.target.value)} />
                  <small>折</small>
                </label>
                <label className={styles.couponField}>
                  <span>最高优惠</span>
                  <input type="number" value={couponMaxOff} onChange={(event) => setCouponMaxOff(event.target.value)} />
                  <small>元</small>
                </label>
              </div>
            ) : null}

            {couponType === 'no_threshold' ? (
              <div className={styles.couponFields}>
                <label className={styles.couponField}>
                  <span>抵扣金额</span>
                  <input type="number" value={couponAmount} onChange={(event) => setCouponAmount(event.target.value)} />
                  <small>元</small>
                </label>
              </div>
            ) : null}

            <div className={styles.couponPreview}>
              <div className={styles.couponPreviewIcon}>🏷️</div>
              <div className={styles.couponPreviewInfo}>
                <div className={styles.couponPreviewAmount}>
                  {couponType === 'discount' ? `${couponDiscount}折` : `¥${couponAmount}`}
                </div>
                <div className={styles.couponPreviewCond}>{previewCoupon}</div>
              </div>
              <div className={styles.couponPreviewTag}>未中补偿</div>
            </div>
          </div>
        ) : null}
      </section>

      <div className={styles.bottomBar}>
        <button className={styles.previewBtn} type="button" onClick={() => setPreviewOpen(true)}>
          预览
        </button>
        <button className={styles.publishBtn} type="button" onClick={handlePublish}>
          发布竞猜
        </button>
      </div>

      {previewOpen ? (
        <div className={styles.previewOverlay} onClick={() => setPreviewOpen(false)}>
          <div className={styles.previewCard} onClick={(event) => event.stopPropagation()}>
            <div className={styles.previewHeader}>
              <div className={styles.previewTitle}>竞猜预览</div>
              <button className={styles.previewClose} type="button" onClick={() => setPreviewOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.previewContent}>
              <div className={styles.previewGuessTitle}>{title || '竞猜标题待填写'}</div>
              <div className={styles.previewGuessDesc}>{desc || '描述一下竞猜规则和奖品...'}</div>
              <div className={styles.previewOptions}>
                {options.filter(Boolean).map((item) => (
                  <div key={item} className={styles.previewOption}>{item}</div>
                ))}
              </div>
              <div className={styles.previewMeta}>开奖时间：{deadline || '未设置'}</div>
            </div>
            <div className={styles.previewFooter}>
              <button className={styles.previewOutline} type="button" onClick={() => setPreviewOpen(false)}>
                继续编辑
              </button>
              <button
                className={styles.previewPrimary}
                type="button"
                onClick={() => {
                  setPreviewOpen(false);
                  handlePublish();
                }}
              >
                确认发布
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {publishing ? (
        <div className={styles.publishOverlay}>
          <div className={styles.publishCard}>
            <div className={styles.publishIcon}>🚀</div>
            <div className={styles.publishTitle}>正在发布竞猜</div>
            <div className={styles.publishDesc}>请稍候，系统正在为你生成竞猜内容</div>
            <div className={styles.publishBar}>
              <div className={styles.publishFill} style={{ width: `${publishStep * 33.33}%` }} />
            </div>
            <div className={styles.publishSteps}>
              <div className={`${styles.publishStep} ${publishStep >= 1 ? styles.publishStepActive : ''}`}>1. 校验竞猜内容</div>
              <div className={`${styles.publishStep} ${publishStep >= 2 ? styles.publishStepActive : ''}`}>2. 生成开奖配置</div>
              <div className={`${styles.publishStep} ${publishStep >= 3 ? styles.publishStepActive : ''}`}>3. 发布到首页</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className={`${styles.toast} ${publishToast ? styles.toastShow : ''}`}>{publishToast}</div>
    </main>
  );
}
