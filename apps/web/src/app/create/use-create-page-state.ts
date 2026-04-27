'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { CreateGuessPayload, UserSummary } from '@umi/shared';

import { fetchMe } from '../../lib/api/auth';
import { fetchSocialFriends } from '../../lib/api/friends';
import { createGuess } from '../../lib/api/guesses';
import { fetchProductList } from '../../lib/api/products';
import { fetchSearchHotKeywords } from '../../lib/api/search';
import { clearAuthToken, hasAuthToken } from '../../lib/api/shared';
import { fetchShopStatus } from '../../lib/api/shops';
import { uploadOssImage } from '../../lib/api/uploads';
import {
  mapProductFeedToCreateProduct,
  mapSearchHotKeywordToCreateTopic,
  mapSocialUserToCreateFriend,
  parseSalesCount,
  type FriendItem,
  type ProductItem,
  type TemplateId,
  type TopicItem,
} from './create-helpers';

function mergeFriendItems(current: FriendItem[], incoming: FriendItem[]) {
  const merged = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) {
    merged.set(item.id, item);
  }
  return Array.from(merged.values());
}

export function useCreatePageState() {
  const router = useRouter();
  const LAST_CREATED_GUESS_KEY = 'umi_last_created_guess';
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [isMerchantMode, setIsMerchantMode] = useState(false);
  const [template, setTemplate] = useState<TemplateId>('pk');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friendKeyword, setFriendKeyword] = useState('');
  const [friendItems, setFriendItems] = useState<FriendItem[]>([]);
  const [visibleFriendItems, setVisibleFriendItems] = useState<FriendItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productKeyword, setProductKeyword] = useState('');
  const [tempProductId, setTempProductId] = useState<string | null>(null);
  const [productCategory, setProductCategory] = useState('all');
  const [productSort, setProductSort] = useState<'default' | 'sales' | 'price_asc' | 'rating'>('default');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState(0);
  const [successOpen, setSuccessOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [titleTipVisible, setTitleTipVisible] = useState(false);
  const [titleInputError, setTitleInputError] = useState(false);
  const [hotTopicItems, setHotTopicItems] = useState<TopicItem[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploaded, setCoverUploaded] = useState(false);
  const [coverUploadedUrl, setCoverUploadedUrl] = useState('');
  const [createdGuessId, setCreatedGuessId] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<Pick<UserSummary, 'name' | 'avatar'> | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const friendSearchRequestId = useRef(0);

  useEffect(() => {
    let ignore = false;

    async function loadCreateDependencies() {
      const tokenReady = hasAuthToken();
      if (!tokenReady) {
        router.replace(`/login?redirect=${encodeURIComponent('/create')}&action=${encodeURIComponent('发布竞猜')}`);
        return;
      }

      let user: Awaited<ReturnType<typeof fetchMe>> | null = null;
      try {
        user = await fetchMe();
      } catch {
        clearAuthToken();
        router.replace(`/login?redirect=${encodeURIComponent('/create')}&action=${encodeURIComponent('发布竞猜')}`);
        return;
      }

      setAuthReady(true);
      const [productResult, topicResult, shopStatusResult] = await Promise.allSettled([
        fetchProductList({ limit: 50 }),
        fetchSearchHotKeywords(6),
        fetchShopStatus(),
      ] as const);

      if (ignore) {
        return;
      }

      if (productResult.status === 'fulfilled') {
        setProductItems(productResult.value.items.map(mapProductFeedToCreateProduct));
      } else {
        showToast('商品数据加载失败');
      }

      if (topicResult.status === 'fulfilled') {
        setHotTopicItems(topicResult.value.items.map(mapSearchHotKeywordToCreateTopic));
      } else {
        showToast('热门数据加载失败');
      }

      if (shopStatusResult.status === 'fulfilled') {
        const merchant = shopStatusResult.value?.status === 'active';
        setIsMerchantMode(merchant);
        setTemplate((current) => {
          if (merchant) {
            return current === 'pk' ? 'duel' : current;
          }
          return 'pk';
        });
      } else {
        showToast('店铺状态加载失败');
      }

      setCurrentUser({
        name: user.name,
        avatar: user.avatar ?? null,
      });
    }

    void loadCreateDependencies();
    return () => {
      ignore = true;
    };
  }, [router]);

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
    if (!shareOpen) {
      setLinkCopied(false);
    }
  }, [shareOpen]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    const requestId = friendSearchRequestId.current + 1;
    friendSearchRequestId.current = requestId;
    const keyword = friendKeyword.trim();

    const timer = window.setTimeout(async () => {
      try {
        const result = await fetchSocialFriends({ q: keyword || undefined, limit: 24 });
        if (friendSearchRequestId.current !== requestId) {
          return;
        }
        const nextItems = result.items.map(mapSocialUserToCreateFriend);
        setFriendItems((current) => mergeFriendItems(current, nextItems));
        setVisibleFriendItems(nextItems);
      } catch {
        if (friendSearchRequestId.current === requestId) {
          showToast('好友搜索失败');
        }
      }
    }, keyword ? 250 : 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [authReady, friendKeyword]);

  useEffect(() => {
    if (template === 'multi') {
      return;
    }
    setOptions((current) => (current.length > 2 ? current.slice(0, 2) : current));
  }, [template]);

  const steps = useMemo(() => {
    const step0 = Boolean(template);
    const step1 = title.trim().length >= 5 && Boolean(coverUploadedUrl);
    const step2 = options.filter((item) => item.trim()).length >= 2;
    const step3 = Boolean(deadline);
    return [step0, step1, step2, step3];
  }, [coverUploadedUrl, deadline, options, template, title]);

  const progress = useMemo(() => Math.round((steps.filter(Boolean).length / 4) * 100), [steps]);
  const selectedCount = options.filter((item) => item.trim()).length;

  const filteredFriends = visibleFriendItems;

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

  const visibleTopics = hotTopicItems;

  /**
   * 分享只使用创建成功后的真实竞猜详情地址，不再生成本地邀请码参数。
   */
  function buildInviteLink() {
    if (typeof window === 'undefined' || !createdGuessId) {
      return '';
    }
    return `${window.location.origin}/guess/${createdGuessId}`;
  }

  const inviteLink = useMemo(() => {
    return buildInviteLink();
  }, [createdGuessId]);

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((item, idx) => (idx === index ? value : item)));
  }

  function selectTemplate(nextTemplate: TemplateId) {
    setTemplate(nextTemplate);
    setOptions((current) => {
      if (nextTemplate === 'number') {
        return ['', ''];
      }
      if (nextTemplate === 'multi') {
        return current.length >= 2 ? current : ['', ''];
      }

      return current.slice(0, 2);
    });
  }

  function addOption() {
    if (template !== 'multi') {
      showToast('当前模板固定为2个选项');
      return;
    }
    setOptions((current) => [...current, '']);
  }

  function removeOption(index: number) {
    if (template !== 'multi') {
      return;
    }
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

  async function refreshTopics() {
    setSelectedTopic('');
    try {
      const result = await fetchSearchHotKeywords(6);
      setHotTopicItems(result.items.map(mapSearchHotKeywordToCreateTopic));
      showToast(result.items.length ? '已刷新话题推荐' : '暂无话题推荐');
    } catch {
      showToast('热门数据加载失败');
    }
  }

  function openShareInvite() {
    if (!createdGuessId) {
      showToast('请先创建竞猜，创建成功后才能分享邀请');
      return;
    }
    setShareOpen(true);
    setLinkCopied(false);
  }

  /**
   * 复制邀请文案时优先走 Clipboard API。
   * 老设备或浏览器能力不足时，退回到 textarea + execCommand 的兼容路径。
   */
  async function copyInviteLink() {
    const link = inviteLink;
    if (!link) {
      showToast('创建成功后才能复制链接');
      return;
    }
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
        showToast('✅ 邀请文案+链接已复制');
        window.setTimeout(() => setLinkCopied(false), 2500);
      } catch {
        showToast('⚠️ 复制失败，请手动长按复制');
      }
    }
  }

  async function shareVia(channel: 'wechat' | 'qq' | 'moments' | 'poster') {
    if (!inviteLink) {
      showToast('创建成功后才能分享');
      return;
    }

    if (channel === 'poster') {
      showToast('海报生成暂未接入');
      return;
    }

    const currentTitle = title.trim() || '好友PK竞猜';
    const shareText = `来优米PK：${currentTitle}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentTitle,
          text: shareText,
          url: inviteLink,
        });
        showToast('已打开系统分享');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        showToast('分享失败，请复制链接分享');
      }
      return;
    }

    showToast('当前浏览器不支持系统分享，请复制链接分享');
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

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('图片读取失败'));
      reader.readAsDataURL(file);
    });
  }

  async function handleCoverPick(file: File | null) {
    if (!file) {
      return;
    }

    if (!hasAuthToken()) {
      showToast('请先登录后再上传封面');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('⚠️ 图片不能超过10MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      showToast('仅支持 jpg/png/webp/gif 图片');
      return;
    }

    setCoverUploading(true);
    setCoverUploaded(false);
    setCoverUploadedUrl('');
    setCoverPreviewUrl('');

    try {
      const contentBase64 = await readFileAsDataUrl(file);
      setCoverPreviewUrl(contentBase64);
      const result = await uploadOssImage({
        fileName: file.name,
        contentType: file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
        contentBase64,
        usage: 'guess_cover',
      });
      setCoverPreviewUrl(result.url);
      setCoverUploadedUrl(result.url);
      setCoverUploaded(true);
      showToast('封面已上传到OSS');
    } catch (error) {
      setCoverUploaded(false);
      setCoverUploadedUrl('');
      setCoverPreviewUrl('');
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
      showToast(error instanceof Error ? error.message : '封面上传失败');
    } finally {
      setCoverUploading(false);
    }
  }

  function sleep(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  /**
   * 创建接口需要的页面提交对象。
   * 封面只使用 OSS 返回的真实地址；发布前已校验必传。
   */
  function buildGuessDraftPayload() {
    const currentTitle = title.trim();
    const filledOptions = options.filter((item) => item.trim());
    const currentScope: 'public' | 'friends' = !isMerchantMode && template === 'pk' ? 'friends' : 'public';

    return {
      title: currentTitle,
      description: desc.trim(),
      options: filledOptions,
      endTime: new Date(deadline).toISOString(),
      type: template === 'pk' ? 'pk' : 'user',
      category: selectedProduct?.category ?? '',
      img: coverUploadedUrl,
      productId: selectedProduct?.id,
      productName: selectedProduct?.name,
      scope: currentScope,
      friendIds: !isMerchantMode && template === 'pk' ? selectedFriends : [],
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

    if (coverUploading) {
      showToast('封面正在上传，请稍后发布');
      return false;
    }

    if (!coverUploadedUrl) {
      showToast('⚠️ 请上传封面图片');
      return false;
    }

    if (filledOptions.length < 2) {
      showToast('⚠️ 至少需要填写2个竞猜选项');
      return false;
    }

    const normalizedOptions = filledOptions.map((item) => item.toLowerCase());
    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      showToast('⚠️ 竞猜选项不能重复');
      return false;
    }

    if (template === 'number') {
      const min = Number(filledOptions[0]);
      const max = Number(filledOptions[1]);
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        showToast('⚠️ 请输入有效数字范围');
        return false;
      }
      if (min >= max) {
        showToast('⚠️ 数值预测范围下限必须小于上限');
        return false;
      }
    }

    if (!isMerchantMode && template === 'pk' && selectedFriends.length === 0) {
      showToast('⚠️ 好友PK必须选择参战好友');
      return false;
    }

    if (isMerchantMode && !selectedProduct) {
      showToast('⚠️ 店铺竞猜必须选择关联商品');
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
    const realInviteeIds: NonNullable<CreateGuessPayload['invitedFriendIds']> =
      !isMerchantMode && template === 'pk'
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

        setPublishStep(3);
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
    selectTemplate,
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
    inviteLink,
    linkCopied,
    currentUser,
    authReady,
    steps,
    progress,
    selectedCount,
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
    copyInviteLink,
    shareVia,
    openProductPicker,
    closeProductPicker,
    handleCoverPick,
    handlePublish,
  };
}
