'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import styles from './page.module.css';

type TemplateId = 'pk' | 'duel' | 'multi' | 'number';
type CouponType = 'full_reduce' | 'discount' | 'no_threshold';

const templates: Array<{
  id: TemplateId;
  icon: string;
  name: string;
  desc: string;
  merchantOnly?: boolean;
}> = [
  { id: 'duel', icon: '⚖️', name: '二选一', desc: 'A vs B 经典对决', merchantOnly: true },
  { id: 'multi', icon: '🎯', name: '多选竞猜', desc: '多个选项自由选', merchantOnly: true },
  { id: 'number', icon: '🔢', name: '数值预测', desc: '猜数字范围', merchantOnly: true },
  { id: 'pk', icon: '🤝', name: '好友PK', desc: '邀请好友对战' },
];

const hotTopicsPool = [
  { text: '乐事新口味谁更能打？', icon: '🔥', hot: true },
  { text: '哪款礼盒更适合送人', icon: '🎁' },
  { text: '猜猜本周爆单商品', icon: '📈' },
  { text: '今年最强春季限定零食', icon: '🌸' },
  { text: '哪款新品会最先卖空', icon: '⏱️' },
  { text: '猜猜下一个爆款联名零食', icon: '🎁', hot: true },
  { text: '辣条哪个品牌最好吃？', icon: '🌶️' },
  { text: '猜猜本周销量冠军是谁？', icon: '🏆' },
  { text: '甜味VS咸味，永恒的对决', icon: '🧂' },
  { text: '这个月谁能吃零食吃得最少？', icon: '😂' },
  { text: '新出的限定口味好不好吃？', icon: '✨', hot: true },
  { text: '猜猜双11零食销量排行', icon: '📊' },
  { text: '健康零食VS快乐零食，你站哪队？', icon: '💪' },
  { text: '谁能猜中下一个网红零食？', icon: '📱' },
  { text: '猜猜今年最佳零食包装设计', icon: '🎨' },
  { text: '进口零食VS国产零食，你更爱哪个？', icon: '🌍' },
  { text: '猜猜春节零食礼盒谁最受欢迎', icon: '🎊', hot: true },
];

const topicsPerPage = 6;

const initialOptions = ['番茄味最畅销', '黄瓜味逆袭'];

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
    category: '薯片',
    price: 49.9,
    originalPrice: 69.9,
    sales: '1.2万',
    rating: '4.9',
    stock: 128,
    img: '/legacy/images/products/p001-lays.jpg',
  },
  {
    id: 'p002',
    name: '奥利奥夹心零食礼盒',
    brand: '奥利奥品牌馆',
    category: '饼干',
    price: 39.9,
    originalPrice: 52.9,
    sales: '8.6k',
    rating: '4.8',
    stock: 86,
    img: '/legacy/images/products/p002-oreo.jpg',
  },
  {
    id: 'p003',
    name: '每日坚果混合礼袋',
    brand: '三只松鼠旗舰店',
    category: '坚果',
    price: 59.9,
    originalPrice: 79.9,
    sales: '6.3k',
    rating: '4.7',
    stock: 54,
    img: '/legacy/images/products/p005-nuts.jpg',
  },
  {
    id: 'p004',
    name: '费列罗节日分享装',
    brand: '费列罗官方旗舰店',
    category: '巧克力',
    price: 89.9,
    originalPrice: 109.9,
    sales: '4.2k',
    rating: '4.9',
    stock: 36,
    img: '/legacy/images/products/p006-ferrero.jpg',
  },
];

/**
 * 创建竞猜页暂时仍是老系统形态对齐页。
 * 这里优先还原旧页面结构和节奏，不在这一轮扩展真实发布链路。
 */
export default function CreatePage() {
  const router = useRouter();
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [isMerchantMode, setIsMerchantMode] = useState(false);
  const [template, setTemplate] = useState<TemplateId>('pk');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState('');
  const [options, setOptions] = useState(initialOptions);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friendKeyword, setFriendKeyword] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<(typeof products)[number] | null>(null);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productKeyword, setProductKeyword] = useState('');
  const [tempProductId, setTempProductId] = useState<string | null>(null);
  const [productCategory, setProductCategory] = useState('all');
  const [productSort, setProductSort] = useState<'default' | 'sales' | 'price_asc' | 'rating'>('default');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [couponEnabled, setCouponEnabled] = useState(true);
  const [couponType, setCouponType] = useState<CouponType>('full_reduce');
  const [couponThreshold, setCouponThreshold] = useState('50');
  const [couponAmount, setCouponAmount] = useState('5');
  const [couponDiscount, setCouponDiscount] = useState('8.5');
  const [couponMaxOff, setCouponMaxOff] = useState('12');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState(0);
  const [successOpen, setSuccessOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [titleTipVisible, setTitleTipVisible] = useState(false);
  const [titleInputError, setTitleInputError] = useState(false);
  const [topicPage, setTopicPage] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploaded, setCoverUploaded] = useState(false);
  const [qrPanelOpen, setQrPanelOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const merchant = window.localStorage.getItem('userRole') === 'merchant';
    setIsMerchantMode(merchant);
    if (merchant) {
      setTemplate('duel');
    } else {
      setTemplate('pk');
      setCouponEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }
    setCouponThreshold(String(Math.round(selectedProduct.price * 0.8)));
    setCouponAmount(String(Math.max(3, Math.round(selectedProduct.price * 0.15))));
    setCouponMaxOff(String(Math.max(3, Math.round(selectedProduct.price * 0.15))));
  }, [selectedProduct]);

  const steps = useMemo(() => {
    const step0 = Boolean(template);
    const step1 = title.trim().length >= 5;
    const step2 = options.filter((item) => item.trim()).length >= 2;
    const step3 = Boolean(deadline);
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

  const filteredFriends = useMemo(() => {
    const keyword = friendKeyword.trim().toLowerCase();
    if (!keyword) {
      return friends;
    }
    return friends.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [friendKeyword]);

  const selectedFriendList = useMemo(
    () => friends.filter((item) => selectedFriends.includes(item.id)),
    [selectedFriends],
  );

  const filteredProducts = useMemo(() => {
    const keyword = productKeyword.trim().toLowerCase();
    let next = products.slice();
    if (productCategory !== 'all') {
      next = next.filter((item) => item.category === productCategory);
    }
    if (keyword) {
      next = next.filter((item) => `${item.name} ${item.brand}`.toLowerCase().includes(keyword));
    }
    if (productSort === 'sales') {
      next.sort((a, b) => parseSalesCount(b.sales) - parseSalesCount(a.sales));
    } else if (productSort === 'price_asc') {
      next.sort((a, b) => a.price - b.price);
    } else if (productSort === 'rating') {
      next.sort((a, b) => Number(b.rating) - Number(a.rating));
    }
    return next;
  }, [productCategory, productKeyword, productSort]);

  const tempProduct = useMemo(
    () => (tempProductId ? products.find((item) => item.id === tempProductId) ?? null : null),
    [tempProductId],
  );

  const productCategories = useMemo(() => ['all', ...Array.from(new Set(products.map((item) => item.category)))], []);

  const sortLabel = useMemo(() => {
    if (productSort === 'sales') {
      return '销量优先';
    }
    if (productSort === 'price_asc') {
      return '价格低→高';
    }
    if (productSort === 'rating') {
      return '好评优先';
    }
    return '综合';
  }, [productSort]);

  const visibleTopics = useMemo(() => {
    const start = (topicPage * topicsPerPage) % hotTopicsPool.length;
    return Array.from({ length: topicsPerPage }, (_, index) => hotTopicsPool[(start + index) % hotTopicsPool.length]);
  }, [topicPage]);

  function parseSalesCount(value: string) {
    if (value.endsWith('万')) {
      return Number.parseFloat(value) * 10000;
    }
    if (value.endsWith('k')) {
      return Number.parseFloat(value) * 1000;
    }
    return Number.parseFloat(value) || 0;
  }

  function formatSalesLabel(value: string) {
    const count = parseSalesCount(value);
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return String(Math.round(count));
  }

  function getDiscountPercent(item: (typeof products)[number]) {
    if (!item.originalPrice || item.originalPrice <= item.price) {
      return 0;
    }
    return Math.round((1 - item.price / item.originalPrice) * 100);
  }

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
    setToast(message);
    window.setTimeout(() => setToast(''), 1800);
  }

  function confirmProductPick() {
    setSelectedProduct(tempProduct);
    setProductPickerOpen(false);
    setSortDropdownOpen(false);
    if (tempProduct) {
      showToast(`✅ 已选择: ${tempProduct.name}`);
    }
  }

  function refreshTopics() {
    setSelectedTopic('');
    setTopicPage((current) => current + 1);
    showToast('🔄 已刷新话题推荐');
  }

  function pickTopic(topicText: string) {
    setTitle(topicText);
    setSelectedTopic(topicText);
    titleInputRef.current?.focus();
  }

  function openProductPicker() {
    setProductPickerOpen(true);
    setTempProductId(selectedProduct?.id ?? null);
    setSortDropdownOpen(false);
  }

  function closeProductPicker() {
    setProductPickerOpen(false);
    setSortDropdownOpen(false);
  }

  function handleCoverPick(file: File | null) {
    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('⚠️ 图片不能超过10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreviewUrl(String(reader.result ?? ''));
      setCoverUploading(true);
      setCoverUploaded(false);
      window.setTimeout(() => {
        setCoverUploading(false);
        setCoverUploaded(true);
        showToast('✅ 封面上传成功');
      }, 800);
    };
    reader.readAsDataURL(file);
  }

  /**
   * 发布前校验沿用老页节奏：
   * 标题错误显示行内提示，其他必填项继续用 toast 拦截。
   */
  function validateBeforePublish() {
    const currentTitle = title.trim();
    const filledOptions = options.filter((item) => item.trim());

    if (!currentTitle || currentTitle.length < 5) {
      setTitleTipVisible(true);
      setTitleInputError(true);
      window.setTimeout(() => setTitleInputError(false), 500);
      return false;
    }

    setTitleTipVisible(false);

    if (filledOptions.length < 2) {
      showToast('⚠️ 至少需要填写2个竞猜选项');
      return false;
    }

    if (!deadline) {
      showToast('⚠️ 请设置开奖时间');
      return false;
    }

    return true;
  }

  /**
   * 这一轮先复刻老页发布流程弹层，不把它误说成真实创建接口状态。
   */
  function handlePublish() {
    if (publishing) {
      return;
    }

    if (!validateBeforePublish()) {
      return;
    }

    setPublishing(true);
    setPublishStep(0);
    setSuccessOpen(false);

    [1, 2, 3, 4].forEach((step, index) => {
      window.setTimeout(() => setPublishStep(step), 500 + index * 500);
    });

    window.setTimeout(() => {
      setPublishing(false);
      setPublishStep(4);
      setSuccessOpen(true);
      showToast('竞猜创建成功！');
    }, 2700);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.headerTitle}>创建竞猜</div>
        <div className={styles.headerAction} />
      </header>

      <div className={`${styles.roleBar} ${isMerchantMode ? styles.merchantMode : styles.userMode}`}>
        <span className={styles.roleIcon}>{isMerchantMode ? '🏪' : '👤'}</span>
        <span className={styles.roleText}>{isMerchantMode ? '商家模式' : '用户模式'}</span>
        <span className={`${styles.roleBadge} ${!isMerchantMode ? styles.roleBadgeHidden : ''}`}>PRO</span>
        <span className={styles.roleDesc}>{isMerchantMode ? '全功能创建模式' : '仅限好友PK竞猜'}</span>
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

      <div className={styles.sectionHeader}>选择竞猜模板</div>
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
                  showToast(`${item.name} 模板`);
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
          <i className={`fa-solid fa-chevron-right ${styles.merchantHookArrow}`} />
        </button>
      ) : null}

      <div className={styles.dividerThick} />

      <section className={styles.formSection}>
        <h3>
          <span className={styles.stepNum}>1</span> 基本信息
          <span className={`${styles.stepStatus} ${steps[1] ? styles.done : styles.pending}`}>{steps[1] ? '✓ 已完成' : '待完善'}</span>
        </h3>

        <div className={styles.field}>
          <label className={styles.label}>
            竞猜标题<span className={styles.requiredMark}>*</span>
          </label>
          <input
            ref={titleInputRef}
            className={`${styles.input} ${titleInputError ? styles.inputError : ''}`}
            placeholder="例如：猜猜今年最火零食是什么？"
            maxLength={50}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <div className={styles.topics}>
            <span className={styles.topicsTag}>
              <i className="fa-solid fa-fire" />
              热门
            </span>
            <div className={styles.topicsScroll}>
              {visibleTopics.map((item) => (
                <button
                  key={item.text}
                  type="button"
                  className={`${styles.topicChip} ${item.hot ? styles.topicChipHot : ''} ${selectedTopic === item.text ? styles.topicChipPicked : ''}`}
                  onClick={() => pickTopic(item.text)}
                >
                  {item.icon} {item.text}
                </button>
              ))}
            </div>
            <button className={styles.topicsMore} type="button" onClick={refreshTopics} title="换一批">
              <i className="fa-solid fa-rotate" />
            </button>
          </div>
          {titleTipVisible ? (
            <div className={styles.validationTip}>
              <i className="fa-solid fa-circle-exclamation" /> 请输入竞猜标题（至少5个字）
            </div>
          ) : null}
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
          <button
            className={`${styles.coverUpload} ${coverUploaded ? styles.coverUploadDone : ''}`}
            type="button"
            onClick={() => coverInputRef.current?.click()}
          >
            {coverPreviewUrl ? <img className={styles.coverPreview} src={coverPreviewUrl} alt="封面预览" /> : null}
            {coverUploading ? (
              <div className={styles.coverUploading}>
                <i className="fa-solid fa-spinner fa-spin" />
                <span>上传中...</span>
              </div>
            ) : null}
            {!coverPreviewUrl && !coverUploading ? (
              <div className={styles.coverPlaceholder}>
                <i className="fa-solid fa-camera" />
                <span>点击上传封面</span>
              </div>
            ) : null}
          </button>
          <input
            ref={coverInputRef}
            hidden
            accept="image/jpeg,image/png,image/webp,image/gif"
            type="file"
            onChange={(event) => handleCoverPick(event.target.files?.[0] ?? null)}
          />
        </div>
      </section>

      <div className={styles.dividerThick} />

      <section className={styles.formSection}>
        <h3>
          <span className={styles.stepNum}>2</span> 竞猜选项<span className={styles.requiredMark}>*</span>
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
              <button className={styles.removeBtn} type="button" onClick={() => removeOption(index)}>
                <i className="fa-solid fa-circle-minus" />
              </button>
            </div>
          ))}
        </div>
        <button className={styles.addOptionBtn} type="button" onClick={addOption}>
          <i className="fa-solid fa-plus" /> 添加选项
        </button>
      </section>

      {template === 'pk' ? (
        <>
          <div className={styles.dividerThick} />
          <section className={styles.formSection}>
            <h3>
              <span className={styles.stepNum}>⚔</span> 邀请好友参战<span className={styles.requiredMark}>*</span>
              <span className={`${styles.stepStatus} ${selectedFriends.length ? styles.done : styles.pending}`}>{selectedFriends.length ? `已选 ${selectedFriends.length} 人` : '待选择'}</span>
            </h3>
            <div className={styles.pkFriendsHeader}>
              <span className={styles.pkFriendsCount}>已选 {selectedFriends.length} 人</span>
              <button className={styles.pkShareBtn} type="button" onClick={() => setShareOpen(true)}>
                <i className="fa-solid fa-share-from-square" /> 分享邀请
              </button>
            </div>
            <div className={styles.pkSearch}>
              <i className="fa-solid fa-magnifying-glass" />
              <input placeholder="搜索好友..." value={friendKeyword} onChange={(event) => setFriendKeyword(event.target.value)} />
            </div>
            <div className={styles.friendsGrid}>
              {filteredFriends.map((friend) => {
                const active = selectedFriends.includes(friend.id);
                return (
                  <button
                    key={friend.id}
                    type="button"
                    className={`${styles.friendCard} ${active ? styles.friendSelected : ''}`}
                    onClick={() => toggleFriend(friend.id)}
                  >
                    <div className={styles.friendCheck}>
                      <i className="fa-solid fa-check" />
                    </div>
                    <div className={`${styles.friendOnline} ${friend.online ? styles.friendOnlineOn : styles.friendOnlineOff}`} />
                    <div className={styles.friendAvatarWrap}>
                      <img src={friend.avatar} alt={friend.name} />
                    </div>
                    <span className={styles.friendName}>{friend.name}</span>
                    <span className={styles.friendMeta}>胜率{friend.online ? '68' : '52'}%</span>
                  </button>
                );
              })}
              <button className={styles.inviteMore} type="button" onClick={() => showToast('邀请更多好友')}>
                <div className={styles.inviteMoreIcon}>
                  <i className="fa-solid fa-plus" />
                </div>
                <span className={styles.inviteMoreText}>邀请</span>
              </button>
            </div>
            {selectedFriendList.length ? (
              <div className={styles.pkSelectedTags}>
                {selectedFriendList.map((friend) => (
                  <button key={friend.id} type="button" className={styles.pkSelectedTag} onClick={() => toggleFriend(friend.id)}>
                    <img src={friend.avatar} alt={friend.name} />
                    <span>{friend.name}</span>
                    <i className="fa-solid fa-xmark" />
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        </>
      ) : null}

      <div className={styles.dividerThick} />

      <section className={styles.formSection}>
        <h3>
          <span className={styles.stepNum}>3</span> 开奖设置
          <span className={`${styles.stepStatus} ${steps[3] ? styles.done : styles.pending}`}>{steps[3] ? '✓ 已设置' : '待完善'}</span>
        </h3>

        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>
              开奖时间<span className={styles.requiredMark}>*</span>
            </div>
            <div className={styles.settingDesc}>竞猜截止并自动开奖</div>
          </div>
          <input className={styles.datetime} type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
        </div>

        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>最低参与人数</div>
            <div className={styles.settingDesc}>未达到将自动退款</div>
          </div>
          <input className={styles.miniNumber} type="number" value="10" readOnly />
        </div>

        <div className={`${styles.settingRow} ${!isMerchantMode ? styles.lockedFeature : ''}`}>
          <div>
            <div className={styles.settingLabel}>
              关联商品 {!isMerchantMode ? <span className={styles.lockedTag}>商家专属</span> : null}
            </div>
            <div className={styles.settingDesc}>选择竞猜关联的商品，猜中可直接购买</div>
          </div>
          <button
            className={styles.linkBtn}
            type="button"
            onClick={() => {
              openProductPicker();
            }}
          >
            选择商品
          </button>
        </div>

        {selectedProduct ? (
          <div className={styles.selectedProductDisplay}>
            <div className={styles.spdCard}>
              <div className={styles.spdImgWrap}>
                <img src={selectedProduct.img} alt={selectedProduct.name} />
                <div className={styles.spdImgBadge}>
                  <i className="fa-solid fa-link" />
                </div>
              </div>
              <div className={styles.spdInfo}>
                <div className={styles.spdName}>{selectedProduct.name}</div>
                <div className={styles.spdBrand}>
                  {selectedProduct.brand} <span className={styles.spdBrandTag}>品牌直供</span>
                </div>
                <div className={styles.spdPriceRow}>
                  {getDiscountPercent(selectedProduct) >= 10 ? <div className={styles.spdPriceTag}>省{getDiscountPercent(selectedProduct)}%</div> : null}
                  <div className={styles.spdPrice}>
                    <small>¥</small>
                    {selectedProduct.price}
                  </div>
                  {selectedProduct.originalPrice > selectedProduct.price ? <span className={styles.spdOrigPrice}>¥{selectedProduct.originalPrice}</span> : null}
                </div>
                <div className={styles.spdMetaRow}>
                  <div className={styles.spdMetaItem}>
                    <i className={`fa-solid fa-fire ${parseSalesCount(selectedProduct.sales) >= 5000 ? styles.spdMetaHot : ''}`} /> {formatSalesLabel(selectedProduct.sales)}已售
                  </div>
                  <div className={styles.spdMetaItem}>
                    <i className="fa-solid fa-star" /> {selectedProduct.rating}
                  </div>
                  {selectedProduct.stock ? (
                    <div className={styles.spdMetaItem}>
                      <i className="fa-solid fa-box" /> 库存{selectedProduct.stock}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className={styles.spdActions}>
                <button className={styles.spdChange} type="button" onClick={openProductPicker}>
                  <i className="fa-solid fa-arrow-right-arrow-left" /> 更换
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>好友PK模式</div>
            <div className={styles.settingDesc}>允许好友对战</div>
          </div>
          <button className={`${styles.toggle} ${styles.toggleActive}`} type="button" aria-label="好友PK模式已开启">
            <span />
          </button>
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

        {couponEnabled && isMerchantMode ? (
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
                <div className={styles.couponPreviewAmount}>{couponType === 'discount' ? `${couponDiscount}折` : `¥${couponAmount}`}</div>
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
              <div className={styles.previewHero}>
                <div className={styles.previewTemplateMeta}>
                  竞猜模板: <b>{templates.find((item) => item.id === template)?.name ?? '二选一'}</b>
                </div>
                <div className={styles.previewGuessTitle}>{title || '未填写标题'}</div>
                {desc ? <div className={styles.previewGuessDesc}>{desc}</div> : null}
                {deadline ? (
                  <div className={styles.previewMeta}>
                    <i className="fa-regular fa-clock" /> 开奖: {new Date(deadline).toLocaleString('zh-CN')}
                  </div>
                ) : null}
              </div>

              {selectedProduct ? (
                <div className={styles.previewProduct}>
                  <img src={selectedProduct.img} alt={selectedProduct.name} />
                  <div className={styles.previewProductInfo}>
                    <div className={styles.previewProductName}>{selectedProduct.name}</div>
                    <div className={styles.previewProductPrice}>¥{selectedProduct.price}</div>
                  </div>
                </div>
              ) : null}

              {options.filter(Boolean).length ? (
                <>
                  <div className={styles.previewOptionsLabel}>竞猜选项:</div>
                  <div className={styles.previewOptions}>
                    {options.filter(Boolean).map((item, index) => (
                      <div key={item} className={styles.previewOption}>
                        <div className={styles.previewOptionBadge}>{String.fromCharCode(65 + index)}</div>
                        <div className={styles.previewOptionText}>{item}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {couponEnabled && isMerchantMode ? (
                <div className={styles.previewCouponCard}>
                  <span className={styles.previewCouponIcon}>🏷️</span>
                  <div className={styles.previewCouponInfo}>
                    <div className={styles.previewCouponAmount}>{couponType === 'discount' ? `${couponDiscount}折` : `¥${couponAmount}`}</div>
                    <div className={styles.previewCouponCond}>{previewCoupon} · 未中补偿</div>
                  </div>
                </div>
              ) : null}

              {!title.trim() || title.trim().length < 5 || options.filter((item) => item.trim()).length < 2 || !deadline ? (
                <div className={styles.previewWarnings}>
                  <div className={styles.previewWarningsTitle}>以下项目需要完善：</div>
                  {!title.trim() || title.trim().length < 5 ? <div className={styles.previewWarning}>⚠️ 标题至少5个字</div> : null}
                  {options.filter((item) => item.trim()).length < 2 ? <div className={styles.previewWarning}>⚠️ 至少需要2个选项</div> : null}
                  {!deadline ? <div className={styles.previewWarning}>⚠️ 未设置开奖时间</div> : null}
                </div>
              ) : null}
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

      {productPickerOpen ? (
        <div className={styles.productPickerOverlay} onClick={closeProductPicker}>
          <div className={styles.productPicker} onClick={(event) => event.stopPropagation()}>
            <div className={styles.ppDragBar} />
            <div className={styles.ppHeader}>
              <div className={styles.ppTitle}>
                <div className={styles.ppTitleIcon}>
                  <i className="fa-solid fa-box-open" />
                </div>
                选择关联商品
                <span className={styles.ppCount}>{products.length}件</span>
              </div>
              <button className={styles.ppClose} type="button" onClick={closeProductPicker}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.ppSearch}>
              <i className="fa-solid fa-magnifying-glass" />
              <input placeholder="搜索商品名称/品牌..." value={productKeyword} onChange={(event) => setProductKeyword(event.target.value)} />
              {productKeyword ? (
                <button className={styles.ppSearchClear} type="button" onClick={() => setProductKeyword('')}>
                  <i className="fa-solid fa-xmark" />
                </button>
              ) : null}
            </div>
            <div className={styles.ppToolbar}>
              <div className={styles.ppCats}>
                {productCategories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`${styles.ppCat} ${productCategory === item ? styles.ppCatOn : ''}`}
                    onClick={() => setProductCategory(item)}
                  >
                    {item === 'all' ? '全部' : item}
                  </button>
                ))}
              </div>
              <div className={styles.ppSortWrap}>
                <button className={`${styles.ppSortBtn} ${sortDropdownOpen ? styles.ppSortBtnOpen : ''}`} type="button" onClick={() => setSortDropdownOpen((value) => !value)}>
                  <span>{sortLabel}</span>
                  <i className="fa-solid fa-chevron-down" />
                </button>
                {sortDropdownOpen ? (
                  <div className={styles.ppSortDropdown}>
                    <button type="button" className={`${styles.ppSortOption} ${productSort === 'default' ? styles.ppSortOptionOn : ''}`} onClick={() => { setProductSort('default'); setSortDropdownOpen(false); }}>
                      <i className="fa-solid fa-fire" /> 综合排序
                    </button>
                    <button type="button" className={`${styles.ppSortOption} ${productSort === 'sales' ? styles.ppSortOptionOn : ''}`} onClick={() => { setProductSort('sales'); setSortDropdownOpen(false); }}>
                      <i className="fa-solid fa-chart-line" /> 销量优先
                    </button>
                    <button type="button" className={`${styles.ppSortOption} ${productSort === 'price_asc' ? styles.ppSortOptionOn : ''}`} onClick={() => { setProductSort('price_asc'); setSortDropdownOpen(false); }}>
                      <i className="fa-solid fa-arrow-up-short-wide" /> 价格低→高
                    </button>
                    <button type="button" className={`${styles.ppSortOption} ${productSort === 'rating' ? styles.ppSortOptionOn : ''}`} onClick={() => { setProductSort('rating'); setSortDropdownOpen(false); }}>
                      <i className="fa-solid fa-star" /> 好评优先
                    </button>
                  </div>
                ) : null}
                <span className={styles.ppResultCount}>{filteredProducts.length}件商品</span>
              </div>
            </div>
            {tempProduct ? (
              <div className={`${styles.ppSelected} ${styles.ppSelectedShow}`}>
                <div className={styles.ppSelectedLabel}>
                  <i className="fa-solid fa-circle-check" /> 已选商品
                </div>
                <div className={styles.ppSelectedCard}>
                  <img src={tempProduct.img} alt={tempProduct.name} />
                  <div className={styles.ppSelInfo}>
                    <div className={styles.ppSelName}>{tempProduct.name}</div>
                    <div className={styles.ppSelBrand}>
                      {tempProduct.brand} <span className={styles.ppSelBrandTag}>官方</span>
                    </div>
                    <div className={styles.ppSelPriceRow}>
                      <span className={styles.ppSelPrice}>
                        <small>¥</small>
                        {tempProduct.price}
                      </span>
                      {tempProduct.originalPrice > tempProduct.price ? <span className={styles.ppSelOrig}>¥{tempProduct.originalPrice}</span> : null}
                      {getDiscountPercent(tempProduct) >= 10 ? <span className={styles.ppSelDiscount}>省{getDiscountPercent(tempProduct)}%</span> : null}
                    </div>
                    <div className={styles.ppSelMeta}>
                      <span className={styles.ppSelMetaItem}>
                        <i className="fa-solid fa-fire" /> {formatSalesLabel(tempProduct.sales)}已售
                      </span>
                      <span className={styles.ppSelMetaItem}>
                        <i className="fa-solid fa-star" /> {tempProduct.rating}分
                      </span>
                      {tempProduct.stock ? (
                        <span className={styles.ppSelMetaItem}>
                          <i className="fa-solid fa-box" /> 库存{tempProduct.stock}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button className={styles.ppsRemove} type="button" onClick={() => setTempProductId(null)}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              </div>
            ) : null}
            {filteredProducts.length ? (
              <div className={styles.ppGrid}>
                {filteredProducts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.ppItem} ${tempProductId === item.id ? styles.ppItemSelected : ''}`}
                    onClick={() => setTempProductId((current) => (current === item.id ? null : item.id))}
                  >
                    <div className={styles.ppItemImg}>
                      <img src={item.img} alt={item.name} />
                      {getDiscountPercent(item) >= 10 ? <div className={styles.ppItemDiscount}>省{getDiscountPercent(item)}%</div> : null}
                    </div>
                    <div className={styles.ppInfo}>
                      <div className={styles.ppName}>{item.name}</div>
                      <div className={styles.ppBrand}>
                        <span className={styles.ppBrandDot} />
                        {item.brand}
                      </div>
                      <div className={styles.ppPriceRow}>
                        <span className={styles.ppPrice}>
                          <small>¥</small>
                          {item.price}
                        </span>
                        {item.originalPrice > item.price ? <span className={styles.ppOrigPrice}>¥{item.originalPrice}</span> : null}
                      </div>
                      <div className={styles.ppMetaRow}>
                        <span className={`${styles.ppSales} ${parseSalesCount(item.sales) >= 5000 ? styles.ppSalesHot : ''}`}>{formatSalesLabel(item.sales)}已售</span>
                        <span className={styles.ppRatingNum}>{item.rating}分</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.ppEmpty}>
                <i className="fa-regular fa-face-meh-blank" />
                <div>未找到相关商品</div>
                <div className={styles.ppEmptyHint}>试试更换关键词或分类</div>
              </div>
            )}
            <div className={styles.ppFooter}>
              <div className={styles.ppFooterInfo}>
                {tempProduct ? (
                  <>
                    已选 <span className={styles.ppfCount}>1</span> 件 · <span className={styles.ppfLabel}>¥{tempProduct.price}</span>
                  </>
                ) : (
                  <span className={styles.ppfLabel}>请选择一件关联商品</span>
                )}
              </div>
              <button className={styles.ppFooterBtnOutline} type="button" onClick={closeProductPicker}>
                取消
              </button>
              <button className={styles.ppFooterBtnPrimary} type="button" onClick={confirmProductPick}>
                确认选择
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {shareOpen ? (
        <div className={styles.shareOverlay} onClick={() => setShareOpen(false)}>
          <div className={styles.shareModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.shareDrag} />
            <div className={styles.shareHeader}>
              <div className={styles.shareTitle}>📤 邀请好友参战</div>
              <button className={styles.shareClose} type="button" onClick={() => setShareOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className={styles.linkCard}>
              <div className={styles.linkLabel}>
                <i className="fa-solid fa-link" /> 邀请链接
                <span className={styles.linkExpiry}>
                  <i className="fa-regular fa-clock" /> 24小时有效
                </span>
              </div>
              <div className={styles.linkRow}>
                <input className={styles.linkInput} readOnly value="https://umi.app/invite/pk-demo-2026" />
                <button className={styles.linkCopy} type="button" onClick={() => showToast('已复制邀请链接')}>
                  复制链接
                </button>
              </div>
            <div className={styles.linkStats}>
              <div>
                <i className="fa-solid fa-user-plus" /> 已邀 <b>{selectedFriends.length}</b> 人
              </div>
              <div>
                <i className="fa-solid fa-eye" /> 链接被点击 <b>0</b> 次
              </div>
              <div>
                <i className="fa-solid fa-rotate" /> <b>换一个链接</b>
              </div>
            </div>
            </div>
            {selectedFriendList.length ? (
                <div className={styles.shareFriends}>
                  <div className={styles.shareFriendsTitle}>
                    <i className="fa-solid fa-check-circle" /> 已选好友将收到邀请
                    <span>{selectedFriendList.length}人</span>
                  </div>
                  <div className={styles.shareFriendsList}>
                  {selectedFriendList.map((friend) => (
                    <div key={friend.id} className={styles.shareFriendChip}>
                      <img src={friend.avatar} alt={friend.name} />
                      <span>{friend.name}</span>
                      <span className={`${styles.shareStatusDot} ${friend.online ? styles.shareStatusOn : styles.shareStatusOff}`} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className={styles.shareMethods}>
              <button type="button" className={styles.shareMethod} onClick={() => showToast('分享到微信')}>
                <div className={`${styles.shareMethodIcon} ${styles.shareMethodWechat}`}>
                  <i className="fa-brands fa-weixin" />
                </div>
                <div className={styles.shareMethodLabel}>微信好友</div>
              </button>
              <button type="button" className={styles.shareMethod} onClick={() => showToast('分享到QQ')}>
                <div className={`${styles.shareMethodIcon} ${styles.shareMethodQq}`}>
                  <i className="fa-brands fa-qq" />
                </div>
                <div className={styles.shareMethodLabel}>QQ好友</div>
              </button>
              <button type="button" className={styles.shareMethod} onClick={() => showToast('分享到猜友圈')}>
                <div className={`${styles.shareMethodIcon} ${styles.shareMethodMoments}`}>
                  <i className="fa-solid fa-users" />
                </div>
                <div className={styles.shareMethodLabel}>猜友圈</div>
              </button>
              <button type="button" className={styles.shareMethod} onClick={() => setQrPanelOpen((value) => !value)}>
                <div className={styles.shareMethodIcon}>
                  <i className="fa-solid fa-qrcode" />
                </div>
                <div className={styles.shareMethodLabel}>二维码</div>
              </button>
              <button type="button" className={styles.shareMethod} onClick={() => showToast('生成海报')}>
                <div className={styles.shareMethodIcon}>
                  <i className="fa-solid fa-image" />
                </div>
                <div className={styles.shareMethodLabel}>生成海报</div>
              </button>
            </div>
            {qrPanelOpen ? (
              <div className={styles.qrPanel}>
                <div className={styles.qrCanvasWrap}>
                  <div className={styles.qrCanvas} />
                  <div className={styles.qrLogo}>🎯</div>
                </div>
                <div className={styles.qrTip}>打开微信扫一扫，邀请好友加入PK</div>
                <button className={styles.qrSave} type="button" onClick={() => showToast('已保存二维码')}>
                  <i className="fa-solid fa-download" /> 保存到相册
                </button>
              </div>
            ) : null}
            <div className={styles.invitePreview}>
              <div className={styles.invitePreviewTitle}>
                <i className="fa-solid fa-eye" /> 好友收到的邀请卡片
              </div>
              <div className={styles.invitePreviewCard}>
                <div className={styles.invitePreviewHead}>
                  <div className={styles.invitePreviewUser}>
                    <img className={styles.invitePreviewAvatar} src="/legacy/images/mascot/mouse-main.png" alt="我" />
                    <div>
                      <div className={styles.invitePreviewName}>我</div>
                      <div className={styles.invitePreviewSub}>邀请你来参与好友PK</div>
                    </div>
                  </div>
                  <div className={styles.invitePreviewMainTitle}>
                    <i className="fa-solid fa-bolt" /> {title.trim() || '好友PK竞猜'}
                  </div>
                </div>
                <div className={styles.invitePreviewVs}>
                  <div className={`${styles.invitePreviewOption} ${styles.invitePreviewOptionA}`}>{options.find((item) => item.trim()) || '选项A'}</div>
                  <div className={styles.invitePreviewVsBadge}>VS</div>
                  <div className={`${styles.invitePreviewOption} ${styles.invitePreviewOptionB}`}>
                    {options.filter((item) => item.trim())[1] || '选项B'}
                  </div>
                </div>
                <div className={styles.invitePreviewFooter}>
                  <div className={styles.invitePreviewMeta}>
                    <span>
                      <i className="fa-regular fa-clock" /> 24h内有效
                    </span>
                    <span>
                      <i className="fa-solid fa-user-plus" /> 已邀{selectedFriendList.length}人
                    </span>
                  </div>
                  <div className={styles.invitePreviewJoin}>立即参战</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {publishing ? (
        <div className={styles.publishOverlay}>
          <div className={styles.publishCard}>
            <div className={styles.publishIcon}>{publishStep >= 4 ? '✅' : '⏳'}</div>
            <div className={styles.publishTitle}>正在发布竞猜...</div>
            <div className={styles.publishDesc}>请稍候，正在提交您的竞猜</div>
            <div className={styles.publishBar}>
              <div className={styles.publishFill} style={{ width: `${publishStep * 25}%` }} />
            </div>
            <div className={styles.publishSteps}>
              <div className={`${styles.publishStep} ${publishStep >= 1 ? styles.publishStepActive : ''} ${publishStep >= 1 ? styles.publishStepDone : ''}`}>
                <i className={`fa-${publishStep >= 1 ? 'solid' : 'regular'} fa-circle`} /> 验证竞猜信息
              </div>
              <div className={`${styles.publishStep} ${publishStep >= 2 ? styles.publishStepActive : ''} ${publishStep >= 2 ? styles.publishStepDone : ''}`}>
                <i className={`fa-${publishStep >= 2 ? 'solid' : 'regular'} fa-circle`} /> 上传竞猜数据
              </div>
              <div className={`${styles.publishStep} ${publishStep >= 3 ? styles.publishStepActive : ''} ${publishStep >= 3 ? styles.publishStepDone : ''}`}>
                <i className={`fa-${publishStep >= 3 ? 'solid' : 'regular'} fa-circle`} /> 生成优惠券
              </div>
              <div className={`${styles.publishStep} ${publishStep >= 4 ? styles.publishStepActive : ''} ${publishStep >= 4 ? styles.publishStepDone : ''}`}>
                <i className={`fa-${publishStep >= 4 ? 'solid' : 'regular'} fa-circle`} /> 发布竞猜
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {successOpen ? (
        <div className={styles.successOverlay} onClick={() => setSuccessOpen(false)}>
          <div className={styles.successCard} onClick={(event) => event.stopPropagation()}>
            <div className={styles.successEmoji}>🎉</div>
            <div className={styles.successTitle}>竞猜创建成功！</div>
            <div className={styles.successDesc}>
              {[
                selectedProduct ? `📦 关联: ${selectedProduct.name}` : '',
                couponEnabled && isMerchantMode ? `🏷️ 补偿: ${couponType === 'discount' ? '折扣券' : couponType === 'no_threshold' ? '无门槛券' : '满减券'}` : '',
              ]
                .filter(Boolean)
                .join(' · ') || '你的竞猜已发布，快分享给好友吧'}
            </div>
            <div className={styles.successActions}>
              <button type="button" className={styles.successAction} onClick={() => showToast('已复制链接')}>
                <div className={styles.successActionIcon}>
                  <i className="fa-solid fa-link" />
                </div>
                <div>复制链接</div>
              </button>
              <button type="button" className={styles.successAction} onClick={() => showToast('分享到微信')}>
                <div className={`${styles.successActionIcon} ${styles.successActionWechat}`}>
                  <i className="fa-brands fa-weixin" />
                </div>
                <div>微信</div>
              </button>
              <button type="button" className={styles.successAction} onClick={() => showToast('分享到猜友圈')}>
                <div className={`${styles.successActionIcon} ${styles.successActionMoments}`}>
                  <i className="fa-solid fa-users" />
                </div>
                <div>猜友圈</div>
              </button>
              <button type="button" className={styles.successAction} onClick={() => showToast('生成海报')}>
                <div className={styles.successActionIcon}>
                  <i className="fa-solid fa-image" />
                </div>
                <div>海报</div>
              </button>
            </div>
            <button className={styles.successPrimary} type="button" onClick={() => router.push('/')}>
              返回首页
            </button>
            <button className={styles.successGhost} type="button" onClick={() => setSuccessOpen(false)}>
              稍后再说
            </button>
          </div>
        </div>
      ) : null}

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
