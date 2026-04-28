'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type {
  CategoryId,
  CreateGuessPayload,
  GuessCategoryItem,
  ProductCategoryItem,
} from '@umi/shared';

import { fetchMe } from '../../lib/api/auth';
import { fetchSocialFriends } from '../../lib/api/friends';
import { createGuess, fetchGuessCategories } from '../../lib/api/guesses';
import { fetchProductCategories, fetchProductList, type ProductListSort } from '../../lib/api/products';
import { fetchSearchHotKeywords } from '../../lib/api/search';
import { clearAuthToken, hasAuthToken } from '../../lib/api/shared';
import { fetchShopStatus } from '../../lib/api/shops';
import { uploadOssImage } from '../../lib/api/uploads';
import {
  mapProductFeedToCreateProduct,
  mapSearchHotKeywordToCreateTopic,
  mapSocialUserToCreateFriend,
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
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [isMerchantMode, setIsMerchantMode] = useState(false);
  const [template, setTemplate] = useState<TemplateId>('pk_friend');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState('');
  const [revealAt, setRevealAt] = useState('');
  const [minParticipants, setMinParticipants] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friendKeyword, setFriendKeyword] = useState('');
  const [friendItems, setFriendItems] = useState<FriendItem[]>([]);
  const [visibleFriendItems, setVisibleFriendItems] = useState<FriendItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [productTotal, setProductTotal] = useState(0);
  const [productOffset, setProductOffset] = useState(0);
  const [productLoading, setProductLoading] = useState(false);
  const [productLoadingMore, setProductLoadingMore] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productKeyword, setProductKeyword] = useState('');
  const [tempProductId, setTempProductId] = useState<string | null>(null);
  const [productCategoryId, setProductCategoryId] = useState<CategoryId | null>(null);
  const [productCategoryItems, setProductCategoryItems] = useState<ProductCategoryItem[]>([]);
  const [productSort, setProductSort] = useState<ProductListSort>('default');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
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
  const [coverUploadedUrl, setCoverUploadedUrl] = useState('');
  const [createdGuessId, setCreatedGuessId] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [guessCategoryItems, setGuessCategoryItems] = useState<GuessCategoryItem[]>([]);
  const [guessCategoriesLoadFailed, setGuessCategoriesLoadFailed] = useState(false);
  const [selectedGuessCategoryId, setSelectedGuessCategoryId] = useState<CategoryId | null>(null);
  const friendSearchRequestId = useRef(0);

  useEffect(() => {
    let ignore = false;

    async function loadCreateDependencies() {
      const tokenReady = hasAuthToken();
      if (!tokenReady) {
        router.replace(`/login?redirect=${encodeURIComponent('/create')}&action=${encodeURIComponent('发布竞猜')}`);
        return;
      }

      try {
        await fetchMe();
      } catch {
        clearAuthToken();
        router.replace(`/login?redirect=${encodeURIComponent('/create')}&action=${encodeURIComponent('发布竞猜')}`);
        return;
      }

      const [productCategoriesResult, topicResult, shopStatusResult, guessCategoriesResult] = await Promise.allSettled([
        fetchProductCategories(),
        fetchSearchHotKeywords(6),
        fetchShopStatus(),
        fetchGuessCategories(),
      ] as const);

      if (ignore) {
        return;
      }

      const failureLabels: string[] = [];

      if (productCategoriesResult.status === 'fulfilled') {
        setProductCategoryItems(productCategoriesResult.value.items);
      } else {
        failureLabels.push('商品分类');
      }

      if (topicResult.status === 'fulfilled') {
        setHotTopicItems(topicResult.value.items.map(mapSearchHotKeywordToCreateTopic));
      } else {
        failureLabels.push('话题');
      }

      if (shopStatusResult.status === 'fulfilled') {
        const merchant = shopStatusResult.value?.status === 'active';
        setIsMerchantMode(merchant);
        setTemplate((current) => {
          if (merchant) {
            return current === 'pk_friend' ? 'duel' : current;
          }
          return current === 'pk_friend' ? current : 'pk_friend';
        });
      } else {
        failureLabels.push('店铺状态');
      }

      if (guessCategoriesResult.status === 'fulfilled') {
        setGuessCategoryItems(guessCategoriesResult.value.items);
        setGuessCategoriesLoadFailed(false);
      } else {
        setGuessCategoriesLoadFailed(true);
        failureLabels.push('竞猜分类');
      }

      if (failureLabels.length) {
        showToast(`${failureLabels.join('、')}加载失败`);
      }

      setAuthReady(true);
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

  const PRODUCT_PICKER_LIMIT = 20;
  const productListRequestId = useRef(0);
  const [productKeywordDebounced, setProductKeywordDebounced] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProductKeywordDebounced(productKeyword.trim());
    }, productKeyword.trim() ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [productKeyword]);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    const reqId = ++productListRequestId.current;
    setProductLoading(true);
    fetchProductList({
      limit: PRODUCT_PICKER_LIMIT,
      offset: 0,
      q: productKeywordDebounced || undefined,
      categoryId: productCategoryId ?? undefined,
      sort: productSort,
    })
      .then((result) => {
        if (productListRequestId.current !== reqId) return;
        setProductItems(result.items.map(mapProductFeedToCreateProduct));
        setProductTotal(result.total);
        setProductOffset(result.items.length);
      })
      .catch(() => {
        if (productListRequestId.current === reqId) {
          showToast('商品加载失败');
        }
      })
      .finally(() => {
        if (productListRequestId.current === reqId) {
          setProductLoading(false);
        }
      });
  }, [authReady, productKeywordDebounced, productCategoryId, productSort]);

  async function loadMoreProducts() {
    if (productLoading || productLoadingMore) return;
    if (productItems.length >= productTotal) return;
    const reqId = ++productListRequestId.current;
    setProductLoadingMore(true);
    try {
      const result = await fetchProductList({
        limit: PRODUCT_PICKER_LIMIT,
        offset: productOffset,
        q: productKeywordDebounced || undefined,
        categoryId: productCategoryId ?? undefined,
        sort: productSort,
      });
      if (productListRequestId.current !== reqId) return;
      const mapped = result.items.map(mapProductFeedToCreateProduct);
      setProductItems((current) => [...current, ...mapped]);
      setProductTotal(result.total);
      setProductOffset((current) => current + mapped.length);
    } catch {
      if (productListRequestId.current === reqId) {
        showToast('加载更多商品失败');
      }
    } finally {
      if (productListRequestId.current === reqId) {
        setProductLoadingMore(false);
      }
    }
  }

  const prevSuccessOpenRef = useRef(false);
  useEffect(() => {
    if (prevSuccessOpenRef.current && !successOpen) {
      resetForm();
    }
    prevSuccessOpenRef.current = successOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successOpen]);

  const steps = useMemo(() => {
    const step0 = Boolean(template);
    const step1 = title.trim().length >= 5 && Boolean(coverUploadedUrl);
    const step2 = options.filter((item) => item.trim()).length >= 2;
    const merchantStep3 = isMerchantMode
      ? Boolean(revealAt) && Number(minParticipants) > 0
      : true;
    const step3 = Boolean(deadline) && Boolean(selectedProduct) && merchantStep3;
    return [step0, step1, step2, step3];
  }, [coverUploadedUrl, deadline, isMerchantMode, minParticipants, options, revealAt, selectedProduct, template, title]);

  const progress = useMemo(() => Math.round((steps.filter(Boolean).length / 4) * 100), [steps]);
  const selectedCount = options.filter((item) => item.trim()).length;

  const publishDisabled = isMerchantMode && guessCategoriesLoadFailed;

  const filteredFriends = visibleFriendItems;

  const selectedFriendList = useMemo(
    () => friendItems.filter((item) => selectedFriends.includes(item.id)),
    [friendItems, selectedFriends],
  );

  const tempProduct = useMemo(() => {
    if (!tempProductId) return null;
    if (selectedProduct?.id === tempProductId) return selectedProduct;
    return productItems.find((item) => item.id === tempProductId) ?? null;
  }, [productItems, tempProductId, selectedProduct]);

  const productHasMore = productItems.length < productTotal;

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

  /**
   * 是否允许 2+ 选项：
   * - `multi` 始终允许；
   * - `pk_friend` 仅在邀请好友数 ≥ 2（多人 PK 模式）时允许，1 人时退化为双人 PK 固定 2 项。
   */
  const allowsManyOptions =
    template === 'multi' || (template === 'pk_friend' && selectedFriends.length >= 2);

  function templateAllowsManyOptions(targetTemplate: TemplateId, friendCount: number) {
    return targetTemplate === 'multi' || (targetTemplate === 'pk_friend' && friendCount >= 2);
  }

  function selectTemplate(nextTemplate: TemplateId) {
    if (nextTemplate === template) {
      return;
    }
    const crossingNumberBoundary = nextTemplate === 'number' || template === 'number';
    setTemplate(nextTemplate);
    setOptions((current) => {
      if (crossingNumberBoundary) {
        return ['', ''];
      }
      if (templateAllowsManyOptions(nextTemplate, selectedFriends.length)) {
        return current.length >= 2 ? current : ['', ''];
      }
      return current.length > 2 ? current.slice(0, 2) : current;
    });
  }

  function addOption() {
    if (!allowsManyOptions) {
      showToast(
        template === 'pk_friend'
          ? '双人PK 固定 2 个选项，邀请第 2 位好友后可添加'
          : '当前模板固定为2个选项',
      );
      return;
    }
    setOptions((current) => [...current, '']);
  }

  function removeOption(index: number) {
    if (!allowsManyOptions) {
      return;
    }
    setOptions((current) => current.filter((_, idx) => idx !== index));
  }

  function toggleFriend(friendId: string) {
    const next = selectedFriends.includes(friendId)
      ? selectedFriends.filter((item) => item !== friendId)
      : [...selectedFriends, friendId];
    setSelectedFriends(next);

    // 好友数从多人 (≥2) 跌回 1 人时，把超过 2 个的选项截断为前 2 个，并提示用户。
    if (template === 'pk_friend' && selectedFriends.length >= 2 && next.length < 2) {
      setOptions((current) => (current.length > 2 ? current.slice(0, 2) : current));
      showToast('已切回双人PK，仅保留前 2 个选项');
    }
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
      showToast('✅ 邀请文案+链接已复制，快去粘贴分享吧！');
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
        showToast('✅ 邀请文案+链接已复制');
      } catch {
        showToast('⚠️ 复制失败，请手动长按复制');
      }
    }
  }

  async function shareVia() {
    if (!inviteLink) {
      showToast('创建成功后才能分享');
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

  function updateTitle(value: string) {
    setTitle(value);
    if (titleTipVisible) {
      setTitleTipVisible(false);
    }
    if (selectedTopic && value !== selectedTopic) {
      setSelectedTopic('');
    }
  }

  function pickTopic(topicText: string) {
    if (title.trim().length > 0) {
      showToast('已有标题，请先清空再选话题');
      return;
    }
    setTitle(topicText);
    setSelectedTopic(topicText);
    setTitleTipVisible(false);
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

  function resetCoverInput() {
    setCoverPreviewUrl('');
    setCoverUploadedUrl('');
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  }

  function resetForm() {
    setTitle('');
    setDesc('');
    setOptions(['', '']);
    setDeadline('');
    setRevealAt('');
    setMinParticipants('');
    setSelectedFriends([]);
    setFriendKeyword('');
    setSelectedProduct(null);
    setTempProductId(null);
    setProductKeyword('');
    setProductCategoryId(null);
    setProductSort('default');
    setSelectedTopic('');
    setTitleTipVisible(false);
    setTitleInputError(false);
    setSelectedGuessCategoryId(null);
    setCreatedGuessId('');
    resetCoverInput();
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
    } catch (error) {
      resetCoverInput();
      showToast(error instanceof Error ? error.message : '封面上传失败');
    } finally {
      setCoverUploading(false);
    }
  }

  function sleep(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
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

    if (!isMerchantMode && template === 'pk_friend' && selectedFriends.length < 1) {
      showToast('⚠️ 好友PK 至少邀请 1 位好友');
      return false;
    }

    if (!selectedProduct) {
      showToast('⚠️ 请选择竞猜关联商品');
      return false;
    }

    if (isMerchantMode && !selectedGuessCategoryId) {
      showToast('⚠️ 商家创建竞猜必须选择分类');
      return false;
    }

    if (!deadline) {
      showToast('⚠️ 请设置投注截止时间');
      return false;
    }

    if (new Date(deadline).getTime() <= Date.now()) {
      showToast('⚠️ 投注截止时间必须晚于当前时间');
      return false;
    }

    if (isMerchantMode) {
      if (!revealAt) {
        showToast('⚠️ 请设置揭晓时间');
        return false;
      }
      if (new Date(revealAt).getTime() < new Date(deadline).getTime()) {
        showToast('⚠️ 揭晓时间必须晚于投注截止时间');
        return false;
      }
      const minNum = Number(minParticipants);
      if (!minParticipants || !Number.isInteger(minNum) || minNum <= 0) {
        showToast('⚠️ 请设置最低参与人数（正整数）');
        return false;
      }
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

    const trimmedTitle = title.trim();
    const filledOptions = options.filter((item) => item.trim());
    const isPkTemplate = template === 'pk_friend';
    const scope: 'public' | 'friends' = !isMerchantMode && isPkTemplate ? 'friends' : 'public';
    const inviteeIds: NonNullable<CreateGuessPayload['invitedFriendIds']> =
      !isMerchantMode && isPkTemplate
        ? (selectedFriends as NonNullable<CreateGuessPayload['invitedFriendIds']>)
        : [];
    const productId: CreateGuessPayload['productId'] =
      (selectedProduct?.id as CreateGuessPayload['productId']) ?? null;

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
          title: trimmedTitle,
          endTime: new Date(deadline).toISOString(),
          optionTexts: filledOptions,
          scope,
          description: desc.trim() || null,
          imageUrl: coverUploadedUrl,
          productId,
          invitedFriendIds: inviteeIds,
          categoryId: selectedGuessCategoryId,
          revealAt: isMerchantMode && revealAt ? new Date(revealAt).toISOString() : null,
          minParticipants: isMerchantMode && minParticipants ? Number(minParticipants) : null,
        });

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
    setTitle: updateTitle,
    desc,
    setDesc,
    deadline,
    setDeadline,
    revealAt,
    setRevealAt,
    minParticipants,
    setMinParticipants,
    options,
    selectedFriends,
    friendKeyword,
    setFriendKeyword,
    selectedProduct,
    productPickerOpen,
    setPreviewOpen,
    productKeyword,
    setProductKeyword,
    tempProductId,
    setTempProductId,
    productSort,
    setProductSort,
    sortDropdownOpen,
    setSortDropdownOpen,
    previewOpen,
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
    coverUploaded: Boolean(coverUploadedUrl),
    authReady,
    guessCategoryItems,
    guessCategoriesLoadFailed,
    selectedGuessCategoryId,
    setSelectedGuessCategoryId,
    publishDisabled,
    steps,
    progress,
    selectedCount,
    filteredFriends,
    selectedFriendList,
    productItems,
    productTotal,
    productLoading,
    productLoadingMore,
    productHasMore,
    productCategoryItems,
    productCategoryId,
    setProductCategoryId,
    tempProduct,
    sortLabel,
    visibleTopics,
    updateOption,
    addOption,
    removeOption,
    allowsManyOptions,
    toggleFriend,
    showToast,
    confirmProductPick,
    refreshTopics,
    pickTopic,
    copyInviteLink,
    shareVia,
    openProductPicker,
    closeProductPicker,
    handleCoverPick,
    handlePublish,
    loadMoreProducts,
  };
}
