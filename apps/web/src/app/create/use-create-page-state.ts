'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { CreateGuessPayload } from '@umi/shared';

import { fetchSocialOverview } from '../../lib/api/friends';
import { createGuess } from '../../lib/api/guesses';
import { fetchProductList } from '../../lib/api/products';
import { hasAuthToken } from '../../lib/api/shared';
import {
  friends,
  hotTopicsPool,
  initialOptions,
  mapProductFeedToCreateProduct,
  mapSocialUserToCreateFriend,
  parseSalesCount,
  products,
  topicsPerPage,
  type CouponType,
  type FriendItem,
  type ProductItem,
  type TemplateId,
} from './create-helpers';

export function useCreatePageState() {
  const LAST_CREATED_GUESS_KEY = 'umi_last_created_guess';
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
  const [friendItems, setFriendItems] = useState<FriendItem[]>(friends);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [productItems, setProductItems] = useState<ProductItem[]>(products);
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
  const [coverUploadedUrl, setCoverUploadedUrl] = useState('');
  const [qrPanelOpen, setQrPanelOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [createdGuessId, setCreatedGuessId] = useState('');
  const [shareClickCount, setShareClickCount] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);

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
    let ignore = false;

    async function loadCreateDependencies() {
      const [productResult, socialResult] = await Promise.allSettled([
        fetchProductList({ limit: 50 }),
        fetchSocialOverview(),
      ]);

      if (ignore) {
        return;
      }

      if (productResult.status === 'fulfilled' && productResult.value.items.length > 0) {
        setProductItems(productResult.value.items.map(mapProductFeedToCreateProduct));
      }

      if (socialResult.status === 'fulfilled' && socialResult.value.friends.length > 0) {
        setFriendItems(socialResult.value.friends.map(mapSocialUserToCreateFriend));
      }
    }

    void loadCreateDependencies();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const invite = searchParams.get('invite');
    const pkMode = searchParams.get('pk') === '1';
    const titleSummary = searchParams.get('t');
    const friendIds = searchParams.get('friends');

    if (!invite && !pkMode && !titleSummary && !friendIds) {
      return;
    }

    if (invite) {
      setInviteCode(invite);
    }
    if (pkMode) {
      setTemplate('pk');
    }
    if (titleSummary) {
      setTitle((current) => current || titleSummary);
    }
    if (friendIds) {
      const incomingIds = friendIds
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      const matchedIds = friendItems.filter((item) => incomingIds.includes(item.id)).map((item) => item.id);
      setSelectedFriends((current) => (current.length ? current : matchedIds));
    }
  }, [friendItems]);

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }
    setCouponThreshold(String(Math.round(selectedProduct.price * 0.8)));
    setCouponAmount(String(Math.max(3, Math.round(selectedProduct.price * 0.15))));
    setCouponMaxOff(String(Math.max(3, Math.round(selectedProduct.price * 0.15))));
  }, [selectedProduct]);

  useEffect(() => {
    if (!sortDropdownOpen || typeof document === 'undefined') {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-create-sort-wrap="true"]')) {
        return;
      }
      setSortDropdownOpen(false);
    };

    window.setTimeout(() => {
      document.addEventListener('click', handleDocumentClick, { once: true });
    }, 10);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [sortDropdownOpen]);

  useEffect(() => {
    if (shareOpen) {
      return;
    }
    setQrPanelOpen(false);
    setLinkCopied(false);
  }, [shareOpen]);

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
      return `最高减${couponMaxOff}元`;
    }
    if (couponType === 'no_threshold') {
      return '无门槛直接抵扣';
    }
    return `满${couponThreshold}元可用`;
  }, [couponAmount, couponDiscount, couponEnabled, couponMaxOff, couponThreshold, couponType]);

  const filteredFriends = useMemo(() => {
    const keyword = friendKeyword.trim().toLowerCase();
    if (!keyword) {
      return friendItems;
    }
    return friendItems.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [friendItems, friendKeyword]);

  const selectedFriendList = useMemo(
    () => friendItems.filter((item) => selectedFriends.includes(item.id)),
    [friendItems, selectedFriends],
  );

  const filteredProducts = useMemo(() => {
    const keyword = productKeyword.trim().toLowerCase();
    let next = productItems.slice();
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
  }, [productCategory, productItems, productKeyword, productSort]);

  const tempProduct = useMemo(
    () => (tempProductId ? productItems.find((item) => item.id === tempProductId) ?? null : null),
    [productItems, tempProductId],
  );

  const productCategories = useMemo(
    () => ['all', ...Array.from(new Set(productItems.map((item) => item.category)))],
    [productItems],
  );

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
    return Array.from(
      { length: topicsPerPage },
      (_, index) => hotTopicsPool[(start + index) % hotTopicsPool.length],
    );
  }, [topicPage]);

  /**
   * 生成分享邀请链接。
   * 当前没有老系统 detail 落地页时，先回落到 create 自身承接参数，避免生成死链。
   */
  function buildInviteLink(code: string) {
    if (typeof window === 'undefined' || !code) {
      return '';
    }
    const params = new URLSearchParams();
    params.set('invite', code);
    params.set('pk', '1');
    if (selectedFriends.length) {
      params.set('friends', selectedFriends.join(','));
    }
    if (title.trim()) {
      params.set('t', title.trim().slice(0, 20));
    }
    const basePath = createdGuessId ? `/guess/${createdGuessId}` : '/create';
    return `${window.location.origin}${basePath}?${params.toString()}`;
  }

  const inviteLink = useMemo(() => {
    return buildInviteLink(inviteCode);
  }, [createdGuessId, inviteCode, selectedFriends, title]);

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((item, idx) => (idx === index ? value : item)));
  }

  function addOption() {
    setOptions((current) => [...current, '']);
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

  function generateInviteCode() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  function openShareInvite() {
    setShareOpen(true);
    setQrPanelOpen(false);
    setLinkCopied(false);
    setInviteCode((current) => current || generateInviteCode());
  }

  function regenerateInviteLink() {
    setInviteCode(generateInviteCode());
    setShareClickCount(0);
    setLinkCopied(false);
    showToast('🔄 已生成新的邀请链接');
  }

  /**
   * 复制邀请文案时优先走 Clipboard API。
   * 老设备或浏览器能力不足时，退回到 textarea + execCommand 的兼容路径。
   */
  async function copyInviteLink() {
    const code = inviteCode || generateInviteCode();
    if (!inviteCode) {
      setInviteCode(code);
    }
    const link = buildInviteLink(code);
    const currentTitle = title.trim() || '好友PK竞猜';
    const filledOptions = options.filter((item) => item.trim());
    const optA = filledOptions[0] || '选项A';
    const optB = filledOptions[1] || '选项B';
    const content = [
      '🎯 来优米PK！',
      `📌 ${currentTitle}`,
      `⚔️ ${optA} VS ${optB}`,
      selectedFriends.length ? `👥 已有${selectedFriends.length}位好友参战` : '',
      `👉 点击加入：${link}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(content);
      setLinkCopied(true);
      setShareClickCount((value) => value + 1);
      showToast('✅ 邀请文案+链接已复制，快去粘贴分享吧！');
      window.setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.setAttribute('readonly', 'readonly');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, content.length);
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setLinkCopied(true);
        setShareClickCount((value) => value + 1);
        showToast('✅ 邀请文案+链接已复制');
        window.setTimeout(() => setLinkCopied(false), 2500);
      } catch {
        showToast('⚠️ 复制失败，请手动长按复制');
      }
    }
  }

  function shareVia(channel: 'wechat' | 'qq' | 'moments' | 'poster') {
    const currentTitle = title.trim() || '好友PK竞猜';
    setShareClickCount((value) => value + 1);
    if (channel === 'wechat') {
      showToast(`📤 正在打开微信分享：${currentTitle}`);
      return;
    }
    if (channel === 'qq') {
      showToast(`📤 正在打开QQ分享：${currentTitle}`);
      return;
    }
    if (channel === 'moments') {
      showToast(`📤 正在分享到猜友圈：${currentTitle}`);
      return;
    }
    showToast('🎨 正在生成PK海报...');
    window.setTimeout(() => showToast('✅ 海报已生成，长按保存分享'), 800);
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
      setCoverUploadedUrl('');
      window.setTimeout(() => {
        setCoverUploading(false);
        setCoverUploaded(true);
        setCoverUploadedUrl(`/uploads/guess-cover-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`);
        showToast('✅ 封面上传成功');
      }, 800);
    };
    reader.readAsDataURL(file);
  }

  function sleep(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  /**
   * 创建页当前仍是老系统式本地发布流。
   * 这里先组装与旧页一致的提交对象，并落到 sessionStorage 供成功层和后续页面承接。
   */
  function buildGuessDraftPayload() {
    const currentTitle = title.trim();
    const filledOptions = options.filter((item) => item.trim());
    const currentScope: 'public' | 'friends' = template === 'pk' ? 'friends' : 'public';

    return {
      id: `draft_${Date.now()}`,
      title: currentTitle,
      description: desc.trim(),
      options: filledOptions,
      endTime: new Date(deadline).toISOString(),
      type: template === 'pk' ? 'pk' : 'user',
      category: selectedProduct?.category ?? '',
      img: coverUploadedUrl || undefined,
      productId: selectedProduct?.id,
      productName: selectedProduct?.name,
      scope: currentScope,
      couponEnabled,
      couponType: couponEnabled ? couponType : null,
      couponPreview: couponEnabled ? previewCoupon : null,
      friendIds: template === 'pk' ? selectedFriends : [],
      inviteCode: inviteCode || null,
      createdAt: new Date().toISOString(),
    };
  }

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

  function handlePublish() {
    if (publishing) {
      return;
    }

    if (!hasAuthToken()) {
      showToast('请先登录后再发布竞猜');
      if (typeof window !== 'undefined') {
        const redirect = window.location.pathname;
        const action = encodeURIComponent('发布竞猜');
        window.setTimeout(() => {
          window.location.href = `/login?redirect=${encodeURIComponent(redirect)}&action=${action}`;
        }, 250);
      }
      return;
    }

    if (!validateBeforePublish()) {
      return;
    }

    const guessDraftPayload = buildGuessDraftPayload();
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(LAST_CREATED_GUESS_KEY, JSON.stringify(guessDraftPayload));
    }

    const realInviteeIds: NonNullable<CreateGuessPayload['invitedFriendIds']> =
      template === 'pk'
        ? (selectedFriends.filter((item) => /^\d+$/.test(String(item))) as NonNullable<CreateGuessPayload['invitedFriendIds']>)
        : [];
    const realProductId: CreateGuessPayload['productId'] =
      guessDraftPayload.productId && /^\d+$/.test(String(guessDraftPayload.productId))
        ? (guessDraftPayload.productId as `${bigint}`)
        : null;

    void (async () => {
      try {
        setPublishing(true);
        setPublishStep(0);
        setSuccessOpen(false);

        setPublishStep(1);
        await sleep(550);

        setPublishStep(2);
        await sleep(650);

        setPublishStep(3);
        await sleep(couponEnabled ? 650 : 240);

        const result = await createGuess({
          title: guessDraftPayload.title,
          endTime: guessDraftPayload.endTime,
          optionTexts: guessDraftPayload.options,
          scope: guessDraftPayload.scope,
          description: guessDraftPayload.description,
          imageUrl: guessDraftPayload.img,
          productId: realProductId,
          invitedFriendIds: realInviteeIds,
        });

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(
            LAST_CREATED_GUESS_KEY,
            JSON.stringify({
              ...guessDraftPayload,
              id: result.id,
              status: result.status,
              reviewStatus: result.reviewStatus,
              scope: result.scope,
            }),
          );
        }
        setCreatedGuessId(result.id);

        setPublishStep(4);
        await sleep(600);
        setPublishing(false);
        setSuccessOpen(true);
        showToast('竞猜创建成功！');
      } catch (error) {
        setPublishing(false);
        setPublishStep(0);
        showToast(error instanceof Error ? error.message : '创建竞猜失败');
      }
    })();
  }

  return {
    titleInputRef,
    coverInputRef,
    isMerchantMode,
    template,
    setTemplate,
    title,
    setTitle,
    desc,
    setDesc,
    deadline,
    setDeadline,
    options,
    selectedFriends,
    setShareOpen,
    friendKeyword,
    setFriendKeyword,
    selectedProduct,
    productPickerOpen,
    setPreviewOpen,
    productKeyword,
    setProductKeyword,
    tempProductId,
    setTempProductId,
    productCategory,
    setProductCategory,
    productSort,
    setProductSort,
    sortDropdownOpen,
    setSortDropdownOpen,
    couponEnabled,
    setCouponEnabled,
    couponType,
    setCouponType,
    couponThreshold,
    setCouponThreshold,
    couponAmount,
    setCouponAmount,
    couponDiscount,
    setCouponDiscount,
    couponMaxOff,
    setCouponMaxOff,
    previewOpen,
    shareOpen,
    publishing,
    publishStep,
    successOpen,
    setSuccessOpen,
    toast,
    titleTipVisible,
    titleInputError,
    selectedTopic,
    coverPreviewUrl,
    coverUploading,
    coverUploaded,
    qrPanelOpen,
    setQrPanelOpen,
    inviteLink,
    shareClickCount,
    linkCopied,
    steps,
    progress,
    selectedCount,
    previewCoupon,
    filteredFriends,
    selectedFriendList,
    filteredProducts,
    productItems,
    tempProduct,
    productCategories,
    sortLabel,
    visibleTopics,
    updateOption,
    addOption,
    removeOption,
    toggleFriend,
    showToast,
    confirmProductPick,
    refreshTopics,
    pickTopic,
    openShareInvite,
    regenerateInviteLink,
    copyInviteLink,
    shareVia,
    openProductPicker,
    closeProductPicker,
    handleCoverPick,
    handlePublish,
  };
}
