'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductCategoryItem, ProductFeedItem } from '@umi/shared';

import { fetchCart } from '../lib/api/cart';
import { favoriteProduct, fetchProductList, unfavoriteProduct } from '../lib/api/products';
import { hasAuthToken } from '../lib/api/shared';

type MallTab = 'recommend' | 'seckill' | 'new' | 'category' | 'sale';
type MallSort = 'default' | 'salesDesc' | 'priceAsc' | 'priceDesc' | 'discountDesc';

type CategoryOption = {
  key: string;
  label: string;
  emoji: string;
  count: number;
};

type CollabVisual = {
  background: string;
  backgroundVar: string;
  badge: string;
  cta: string;
  textOnly: boolean;
};

const collabVisuals: CollabVisual[] = [
  {
    background: 'linear-gradient(135deg, #D4A017 0%, #B8860B 50%, #8B6914 100%)',
    backgroundVar: '#8B6914',
    badge: '联名限定',
    cta: '参与竞猜 →',
    textOnly: false,
  },
  {
    background: 'linear-gradient(135deg, #2C1810 0%, #4A2C20 50%, #2C1810 100%)',
    backgroundVar: '#2C1810',
    badge: '品牌大使',
    cta: '查看系列 →',
    textOnly: true,
  },
  {
    background: 'linear-gradient(135deg, #1A1A1A 0%, #333333 50%, #1A1A1A 100%)',
    backgroundVar: '#1A1A1A',
    badge: '全球代言',
    cta: '探索新品 →',
    textOnly: true,
  },
  {
    background: 'linear-gradient(135deg, #1A0A2E 0%, #3D1D5E 50%, #1A0A2E 100%)',
    backgroundVar: '#1A0A2E',
    badge: '限时活动',
    cta: '立即参与 →',
    textOnly: true,
  },
];

const LEGACY_GRID_HEIGHTS = [180, 210, 165, 220, 175, 195, 185, 205, 170, 200, 190, 215];

/**
 * 商城金额展示统一入口。
 * 这里保留老商城的展示习惯：整数不补小数，非整数保留 1 位。
 */
function formatPrice(value: number) {
  return value.toFixed(value % 1 === 0 ? 0 : 1);
}

/**
 * 商城销量展示统一入口。
 * 大于 1 万时转成“万”单位，保持老商城卡片上的短文案风格。
 */
function formatSales(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万`;
  }
  return String(value);
}

function getCategoryEmoji(label: string) {
  if (label.includes('美妆') || label.includes('护肤') || label.includes('彩妆')) return '💄';
  if (label.includes('潮玩') || label.includes('盲盒') || label.includes('玩具')) return '🎲';
  if (label.includes('食品') || label.includes('饮料') || label.includes('零食') || label.includes('酒水')) return '🍜';
  if (label.includes('数码') || label.includes('家电') || label.includes('手机') || label.includes('电脑')) return '📱';
  if (label.includes('服饰') || label.includes('鞋') || label.includes('箱包') || label.includes('配饰')) return '👟';
  if (label.includes('生活') || label.includes('家居') || label.includes('日用') || label.includes('清洁')) return '🏠';
  return '📦';
}

/**
 * 把联名标题拆成左右两段。
 * 联名卡和 banner 都按老商城的“A × B”排版来渲染。
 */
function splitCollabLabel(item: ProductFeedItem) {
  const collabText = item.collab?.trim() || `${item.brand} × ${item.category}`;
  const parts = collabText.split(/\s*[×xX✕]\s*/);
  return {
    left: parts[0] || item.brand,
    right: parts[1] || item.category,
  };
}

function buildCollabTitle(item: ProductFeedItem) {
  return item.collab?.trim() || `${item.brand} · ${item.category}`;
}

function splitDisplayCollab(item: ProductFeedItem) {
  const title = item.collab?.trim() || `${item.brand} × ${item.category}`;
  const parts = title.split(/\s*[×xX✕]\s*/);
  return {
    left: parts[0] || item.brand,
    right: parts[1] || item.category,
  };
}

function buildCollabSubtitle(item: ProductFeedItem) {
  return item.tags[1] || item.tags[0] || item.name;
}

function buildBrandLogoText(brand: string) {
  const normalized = brand.trim().toUpperCase();
  if (!normalized) {
    return 'UMI';
  }
  if (/^[A-Z]+$/.test(normalized) && normalized.length <= 4) {
    return normalized.split('').join('·');
  }
  return normalized.slice(0, 8);
}

function buildBrandAvatarText(brand: string) {
  const trimmed = brand.trim();
  if (!trimmed) {
    return 'J';
  }
  return trimmed.slice(0, 1).toUpperCase();
}

/**
 * 计算 hero 进度条展示值。
 * 这里仍然是基于真实商品销量和库存做展示推导，不是独立活动进度源。
 */
function buildHeroProgress(item: ProductFeedItem) {
  const base = item.sales + item.stock;
  if (base <= 0) {
    return 18;
  }
  return Math.min(96, Math.max(18, Math.round((item.sales / base) * 100)));
}

function buildHeroPrimaryLine(item: ProductFeedItem) {
  return `竞猜价 ¥${formatPrice(item.guessPrice)} · 原价 ¥${formatPrice(item.price)}`;
}

function buildHeroSecondaryLine(item: ProductFeedItem) {
  return `${item.category} · ${item.shopName || item.brand} · 已售 ${formatSales(item.sales)}`;
}

function buildBannerSubtitle(item: ProductFeedItem) {
  return `${item.category} · ${item.brand} · 已售${formatSales(item.sales)}`;
}

/**
 * 生成瀑布流卡高。
 * 推荐流沿用老商城的固定高低节奏，避免真实数据顺序变化后把版式打散。
 */
function buildGridHeight(item: ProductFeedItem, index: number) {
  return item.height || LEGACY_GRID_HEIGHTS[index % LEGACY_GRID_HEIGHTS.length];
}

/**
 * 给商品流批量补上老商城瀑布流元信息。
 * 这里只控制展示节奏，不改真实商品排序和业务字段。
 */
function applyLegacyGridMeta(items: ProductFeedItem[]) {
  return items.map((item, index) => ({
    ...item,
    height: LEGACY_GRID_HEIGHTS[index % LEGACY_GRID_HEIGHTS.length],
  }));
}

function applyFavoritedState(items: ProductFeedItem[], productId: string, favorited: boolean) {
  return items.map((item) => (item.id === productId ? { ...item, favorited } : item));
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/**
 * 商城首页主组件。
 * 商品、分类、收藏和购物车角标走真实接口；活动位和瀑布流节奏继续按老商城页面结构对齐。
 */
export function MallHome() {
  const router = useRouter();
  const [mallItems, setMallItems] = useState<ProductFeedItem[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategoryItem[]>([]);
  const [categoryItems, setCategoryItems] = useState<Record<string, ProductFeedItem[]>>({});
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>({});
  const [catOpen, setCatOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [feedAnimating, setFeedAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState<MallTab>('recommend');
  const [contentTab, setContentTab] = useState<MallTab>('recommend');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState<MallSort>('default');
  const [reloadToken, setReloadToken] = useState(0);
  const [categoryReloadToken, setCategoryReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;

    /**
     * 加载商城首屏主数据。
     * 商品流和购物车角标分开容错，避免其中一条链路失败时把整页全部打空。
     */
    async function load() {
      if (!ignore) {
        setLoading(true);
        setProductError(null);
        setCartError(null);
      }

      try {
        const [result, cartResult] = await Promise.allSettled([
          fetchProductList(50),
          hasAuthToken() ? fetchCart() : Promise.resolve({ items: [] }),
        ]);
        if (!ignore) {
          if (result.status === 'fulfilled') {
            setMallItems(applyLegacyGridMeta(result.value.items));
            setProductCategories(result.value.categories);
          } else {
            setProductError(getErrorMessage(result.reason, '商品流读取失败'));
          }
          if (cartResult.status === 'fulfilled') {
            setCartCount(cartResult.value.items.length);
          } else {
            setCartError(getErrorMessage(cartResult.reason, '购物车读取失败'));
          }
        }
      } catch (error) {
        if (!ignore) {
          const message = getErrorMessage(error, '商城首页读取失败');
          setProductError(message);
          setCartError(message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    setFeedAnimating(true);
    const timer = window.setTimeout(() => setFeedAnimating(false), 400);
    return () => window.clearTimeout(timer);
  }, [activeCategory, activeSort, contentTab, showAll]);

  const categoryOptions = useMemo<CategoryOption[]>(() => {
    const totalCount = productCategories.reduce((sum, item) => sum + item.count, 0);

    return [
      {
        key: 'all',
        label: '全部',
        emoji: '🔖',
        count: totalCount,
      },
      ...productCategories.map((item) => ({
        key: item.id,
        label: item.name,
        emoji: getCategoryEmoji(item.name),
        count: item.count,
      })),
    ];
  }, [productCategories]);

  useEffect(() => {
    if (activeCategory === 'all') {
      return;
    }
    if (!categoryOptions.some((item) => item.key === activeCategory)) {
      setActiveCategory('all');
    }
  }, [activeCategory, categoryOptions]);

  const activeCategoryOption = categoryOptions.find((item) => item.key === activeCategory) || categoryOptions[0];
  const hotCategories = useMemo(() => {
    const ranked = categoryOptions.filter((item) => item.key !== 'all' && item.count > 0);
    return (ranked.length ? ranked : categoryOptions.filter((item) => item.key !== 'all')).slice(0, 6);
  }, [categoryOptions]);

  const activeCategoryItems = activeCategory === 'all' ? mallItems : (categoryItems[activeCategory] ?? []);
  const activeCategoryError =
    contentTab === 'category' && activeCategory !== 'all'
      ? categoryErrors[activeCategory] ?? null
      : null;

  useEffect(() => {
    if (contentTab !== 'category' || activeCategory === 'all' || categoryItems[activeCategory]) {
      return;
    }

    let ignore = false;
    setCategoryLoading(true);

    async function loadCategoryItems() {
      try {
        setCategoryErrors((current) => {
          if (!(activeCategory in current)) {
            return current;
          }
          const next = { ...current };
          delete next[activeCategory];
          return next;
        });

        const result = await fetchProductList({ limit: 50, categoryId: activeCategory });
        if (!ignore) {
          setCategoryItems((current) => ({ ...current, [activeCategory]: applyLegacyGridMeta(result.items) }));
          setProductCategories(result.categories);
        }
      } catch (error) {
        if (!ignore) {
          setCategoryErrors((current) => ({
            ...current,
            [activeCategory]: getErrorMessage(error, '分类商品读取失败'),
          }));
        }
      } finally {
        if (!ignore) {
          setCategoryLoading(false);
        }
      }
    }

    void loadCategoryItems();

    return () => {
      ignore = true;
    };
  }, [activeCategory, categoryItems, categoryReloadToken, contentTab]);

  const filteredItems = useMemo(() => {
    let next = [...mallItems];

    if (contentTab === 'seckill') {
      next = mallItems.filter((item) => {
        if (item.originalPrice <= 0) {
          return false;
        }
        return Math.round((item.discountAmount / item.originalPrice) * 100) >= 20;
      });
      next.sort((left, right) => right.discountAmount - left.discountAmount);
    } else if (contentTab === 'new') {
      next = mallItems.filter((item) => item.stock >= 200);
      next.sort((left, right) => right.stock - left.stock);
    } else if (contentTab === 'sale') {
      next = mallItems.filter((item) => {
        if (item.originalPrice <= 0) {
          return false;
        }
        return Math.round((item.discountAmount / item.originalPrice) * 100) >= 15;
      });
      next.sort((left, right) => left.price - right.price);
    } else if (contentTab === 'category' && activeCategory !== 'all') {
      next = [...activeCategoryItems];
    }

    if (activeSort === 'salesDesc') {
      next.sort((left, right) => right.sales - left.sales);
    } else if (activeSort === 'priceAsc') {
      next.sort((left, right) => left.price - right.price);
    } else if (activeSort === 'priceDesc') {
      next.sort((left, right) => right.price - left.price);
    } else if (activeSort === 'discountDesc') {
      next.sort((left, right) => right.discountAmount - left.discountAmount);
    }

    return next;
  }, [activeCategory, activeCategoryItems, activeSort, contentTab, mallItems]);

  const maxDiscount = useMemo(
    () =>
      filteredItems.reduce((max, item) => {
        if (item.originalPrice <= 0) {
          return max;
        }
        const percent = Math.round((item.discountAmount / item.originalPrice) * 100);
        return Math.max(max, percent);
      }, 0),
    [filteredItems],
  );

  const featuredItem = contentTab === 'recommend' ? filteredItems[0] ?? null : null;
  const bannerItem = contentTab === 'recommend' ? filteredItems[1] ?? filteredItems[0] ?? null : null;
  const collabPool = useMemo(() => {
    const explicit = mallItems.filter((item) =>
      Boolean(item.collab) || item.tags.some((tag) => tag.includes('联名') || tag.includes('限定') || tag.includes('活动')),
    );
    return explicit;
  }, [mallItems]);
  const gridStartIndex = contentTab === 'recommend' ? 1 : 0;
  const totalGridItems = filteredItems.slice(gridStartIndex);
  const shouldPaginate = contentTab === 'recommend';
  const visibleGridItems = shouldPaginate && !showAll ? totalGridItems.slice(0, 11) : totalGridItems;
  const hasMore = shouldPaginate && totalGridItems.length > visibleGridItems.length;
  const hasLoadedMore = shouldPaginate && showAll;
  const useInlinePairGrid = contentTab === 'sale' && visibleGridItems.length === 2;

  function updateSort(sort: MallSort) {
    setActiveSort(sort);
    if (catOpen || activeTab === 'category') {
      setActiveTab('category');
      setContentTab('category');
    }
    setShowAll(false);
  }

  function selectCategory(categoryKey: string) {
    setActiveCategory(categoryKey);
    setActiveTab('category');
    setContentTab('category');
    setCatOpen(false);
    setShowAll(false);
  }

  function handleTabClick(tab: MallTab) {
    if (tab === 'category') {
      if (catOpen) {
        setCatOpen(false);
        return;
      }
      setActiveTab('category');
      setCatOpen(true);
      return;
    }

    setCatOpen(false);
    setActiveTab(tab);
    setContentTab(tab);
    setActiveCategory('all');
    setActiveSort('default');
    setShowAll(false);
  }

  async function toggleFavorite(productId: string, nextFavorited: boolean) {
    setMallItems((current) => applyFavoritedState(current, productId, nextFavorited));
    setCategoryItems((current) =>
      Object.fromEntries(
        Object.entries(current).map(([key, items]) => [key, applyFavoritedState(items, productId, nextFavorited)]),
      ),
    );

    try {
      if (nextFavorited) {
        await favoriteProduct(productId);
      } else {
        await unfavoriteProduct(productId);
      }
    } catch {
      setMallItems((current) => applyFavoritedState(current, productId, !nextFavorited));
      setCategoryItems((current) =>
        Object.fromEntries(
          Object.entries(current).map(([key, items]) => [key, applyFavoritedState(items, productId, !nextFavorited)]),
        ),
      );
    }
  }

  const tabBanner =
    contentTab === 'seckill' ? (
      <div className="m-tab-banner" style={{ background: 'linear-gradient(135deg,#FF3D00,#FF6D00)' }}>
        <span className="mtb-icon">⚡</span>
        <span className="mtb-text">限时秒杀 · {filteredItems.length}款折扣商品</span>
        <span className="mtb-tag">最高省{maxDiscount}%</span>
      </div>
    ) : contentTab === 'new' ? (
      <div className="m-tab-banner" style={{ background: 'linear-gradient(135deg,#00C853,#64DD17)' }}>
        <span className="mtb-icon">🆕</span>
        <span className="mtb-text">新品上架 · {filteredItems.length}款新品</span>
        <span className="mtb-tag">抢先体验</span>
      </div>
    ) : contentTab === 'sale' ? (
      <div className="m-tab-banner" style={{ background: 'linear-gradient(135deg,#E8511A,#FF8A65)' }}>
        <span className="mtb-icon">🏷️</span>
        <span className="mtb-text">特价专区 · {filteredItems.length}款特卖</span>
        <span className="mtb-tag">最高省{maxDiscount}%</span>
      </div>
    ) : contentTab === 'category' && activeCategoryOption?.key !== 'all' ? (
      <div className="m-tab-banner" style={{ background: 'linear-gradient(135deg,#5C6BC0,#7E57C2)' }}>
        <span className="mtb-icon">{activeCategoryOption?.emoji || '📦'}</span>
        <span className="mtb-text">{activeCategoryOption?.label} · {activeCategoryOption?.count ?? filteredItems.length}款商品</span>
      </div>
    ) : null;

  function renderGridCard(item: ProductFeedItem, index: number) {
    const liked = item.favorited;
    const cardHeight = useInlinePairGrid ? 152 : buildGridHeight(item, index);

    return (
      <article
        className="m-card mfc-enter"
        key={item.id}
        onClick={() => router.push(`/product/${item.id}`)}
        style={{ animationDelay: `${index * 0.04}s` }}
      >
        <div className="m-card-img" style={{ height: cardHeight }}>
          <img alt={item.name} src={item.img || '/legacy/images/products/p001-lays.jpg'} />
          <button
            className={`m-card-fav ${liked ? 'liked' : ''}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void toggleFavorite(item.id, !liked);
            }}
          >
            <i className={liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
          </button>
        </div>
        <div className="m-card-body">
          <div className="m-card-title">{item.name}</div>
          <div className="m-card-price-row">
            <span className="m-card-price">
              <small>¥</small>
              {formatPrice(item.price)}
            </span>
            {item.originalPrice > item.price ? <span className="m-card-orig">¥{formatPrice(item.originalPrice)}</span> : null}
          </div>
          <div className="m-card-bottom">
            <div className="m-card-tags">
              <span className={`m-card-mini-tag ${item.miniTag}`}>{item.tag}</span>
            </div>
            <span className="m-card-sales">{formatSales(item.sales)}人付款</span>
          </div>
        </div>
      </article>
    );
  }

  const gridNodes = visibleGridItems.flatMap((item, index) => {
      const visual = collabVisuals[Math.floor(index / 4) % collabVisuals.length];
      const nodes = [renderGridCard(item, index)];

      if ((index + 1) % 4 === 0 && collabPool.length > 0) {
        const collabItem = collabPool[Math.floor(index / 4) % collabPool.length];
        const collabTitle = splitDisplayCollab(collabItem);
        const collabSubtitle = buildCollabSubtitle(collabItem);

        nodes.push(
          <article
            className={`m-collab-card mfc-enter ${visual.textOnly ? 'text-only' : ''}`}
            key={`collab-${collabItem.id}-${index}`}
            onClick={() => router.push(`/product/${collabItem.id}`)}
            style={{ background: visual.background, animationDelay: `${(index + 1) * 0.04}s` }}
          >
            <div className="m-collab-badge">{collabItem.tags[0] || visual.badge}</div>
            {visual.textOnly ? (
              <div className="m-collab-content">
                <div className="m-collab-title">{collabTitle.left} <span className="collab-x">×</span> {collabTitle.right}</div>
                <div className="m-collab-sub">{collabSubtitle}</div>
                <button className="m-collab-cta" type="button" onClick={(event) => { event.stopPropagation(); router.push(`/product/${collabItem.id}`); }}>
                  {visual.cta}
                </button>
              </div>
            ) : (
              <div className="m-collab-inner">
                <div className="m-collab-avatar" style={{ ['--collab-bg' as string]: visual.backgroundVar }}>
                  <img src={collabItem.img || '/legacy/images/products/p001-lays.jpg'} alt={collabItem.brand} />
                </div>
                <div className="m-collab-content">
                  <div className="m-collab-title">{collabTitle.left} <span className="collab-x">×</span> {collabTitle.right}</div>
                  <div className="m-collab-sub">{collabSubtitle}</div>
                  <button className="m-collab-cta" type="button" onClick={(event) => { event.stopPropagation(); router.push(`/product/${collabItem.id}`); }}>
                    {visual.cta}
                  </button>
                </div>
              </div>
            )}
          </article>,
        );
      }

      return nodes;
    });

  const heroNames = featuredItem ? splitCollabLabel(featuredItem) : null;
  const heroProgress = featuredItem ? buildHeroProgress(featuredItem) : 0;
  const heroMeta = featuredItem
    ? [...new Set([featuredItem.category, featuredItem.shopName, featuredItem.collab].filter((value): value is string => Boolean(value?.trim())))]
    : [];

  return (
    <main className="mall-home">
      <div className="m-nav">
        <div className="m-logo">
          <span className="m-logo-main">Umi</span>
          <span className="m-logo-sub">优选</span>
        </div>
        <div className="m-search" onClick={() => router.push('/search?from=mall')} role="button" tabIndex={0}>
          <i className="fa-solid fa-magnifying-glass" />
          <span>搜索商品/竞猜</span>
        </div>
        <div className="m-icons">
          <button className="m-ico" type="button" onClick={() => router.push('/community')}>
            <i className="fa-regular fa-comment-dots" />
          </button>
          <button className="m-ico" type="button" onClick={() => router.push('/cart')}>
            <i className="fa-solid fa-cart-shopping" />
            {cartCount > 0 ? <span className="m-ico-badge">{Math.min(cartCount, 99)}</span> : null}
          </button>
        </div>
      </div>

      <div className="m-tabs" id="mTabs">
        <button className={`m-tab ${activeTab === 'recommend' ? 'on' : ''}`} type="button" onClick={() => handleTabClick('recommend')}>
          推荐
        </button>
        <button className={`m-tab ${activeTab === 'seckill' ? 'on' : ''}`} type="button" onClick={() => handleTabClick('seckill')}>
          秒杀 <span className="m-tab-badge badge-seckill">HOT</span>
        </button>
        <button className={`m-tab ${activeTab === 'new' ? 'on' : ''}`} type="button" onClick={() => handleTabClick('new')}>
          新品 <span className="m-tab-badge badge-new">NEW</span>
        </button>
        <button className={`m-tab ${activeTab === 'category' ? 'on' : ''}`} id="mCatTab" type="button" onClick={() => handleTabClick('category')}>
          {activeCategoryOption?.key === 'all' ? '分类▾' : `${activeCategoryOption?.label} ▾`}
        </button>
        <button className={`m-tab ${activeTab === 'sale' ? 'on' : ''}`} type="button" onClick={() => handleTabClick('sale')}>
          特卖 <span className="m-tab-badge badge-special">省</span>
        </button>
      </div>

      <div className={`m-cat-dropdown ${catOpen ? 'open' : ''}`} id="mCatDropdown">
        <div className="m-cat-mask" onClick={() => setCatOpen(false)} />
        <div className="m-cat-panel">
          <div className="m-cat-title">🔥 热门分类</div>
          <div className="m-cat-hot" id="mCatHot">
            {hotCategories.map((item) => (
              <div className={`m-cat-hot-item ${activeCategory === item.key ? 'on' : ''}`} key={item.key} onClick={() => selectCategory(item.key)}>
                <div className="mchi-icon">{item.emoji}</div>
                <div className="mchi-name">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="m-cat-title">全部分类</div>
          <div className="m-cat-grid" id="mCatGrid">
            {categoryOptions.map((item) => (
              <div className={`m-cat-item ${activeCategory === item.key ? 'on' : ''}`} key={item.key} onClick={() => selectCategory(item.key)}>
                {item.emoji} {item.label} <span className="mci-count">{item.count}</span>
              </div>
            ))}
          </div>
          <div className="m-cat-sort">
            <span className="m-cat-sort-label">排序：</span>
            <span className={`m-cat-sort-btn ${activeSort === 'default' ? 'on' : ''}`} onClick={() => updateSort('default')}>综合</span>
            <span className={`m-cat-sort-btn ${activeSort === 'salesDesc' ? 'on' : ''}`} onClick={() => updateSort('salesDesc')}>销量↓</span>
            <span className={`m-cat-sort-btn ${activeSort === 'priceAsc' ? 'on' : ''}`} onClick={() => updateSort('priceAsc')}>价格↑</span>
            <span className={`m-cat-sort-btn ${activeSort === 'priceDesc' ? 'on' : ''}`} onClick={() => updateSort('priceDesc')}>价格↓</span>
            <span className={`m-cat-sort-btn ${activeSort === 'discountDesc' ? 'on' : ''}`} onClick={() => updateSort('discountDesc')}>折扣↓</span>
          </div>
        </div>
      </div>

      <div className={`m-feed-area ${feedAnimating ? 'm-feed-animate' : ''}`} id="mFeedArea">
        {!loading && cartError ? (
          <div className="m-state-card m-state-card-warning">
            <div className="m-state-title">购物车状态读取失败</div>
            <div className="m-state-desc">{cartError}</div>
            <button className="m-state-action" type="button" onClick={() => setReloadToken((current) => current + 1)}>
              重新加载
            </button>
          </div>
        ) : null}

        {tabBanner}

        {!loading && productError ? (
          <div className="m-state-card m-state-card-error">
            <div className="m-state-title">商品流加载失败</div>
            <div className="m-state-desc">{productError}</div>
            <button className="m-state-action" type="button" onClick={() => setReloadToken((current) => current + 1)}>
              重试
            </button>
          </div>
        ) : null}

        {contentTab === 'recommend' && featuredItem && heroNames ? (
          <section className="m-hero mfc-enter" style={{ animationDelay: '0s' }}>
            <div className="m-hero-header" onClick={() => router.push(`/product/${featuredItem.id}`)}>
              <div className="m-hero-collab">
                <span className="collab-left">{heroNames.left}</span>
                <span className="collab-divider" />
                <span className="collab-right">{heroNames.right}</span>
              </div>
            </div>
            <div className="m-hero-poster-wrap">
              <div className="m-hero-img" onClick={() => router.push(`/product/${featuredItem.id}`)}>
                <img alt={featuredItem.name} src={featuredItem.img || '/legacy/images/products/p001-lays.jpg'} />
                <div className="m-hero-img-logo">
                  <span className="m-hero-img-logo-text">{buildBrandLogoText(featuredItem.brand)}</span>
                </div>
                <div className="m-hero-img-badge">
                  <i className="fa-solid fa-crown" /> {featuredItem.collab ? '限定联名' : featuredItem.tag}
                </div>
                <div className="m-hero-img-overlay">
                  <div className="m-hero-promo-l1">
                    <span className="p-yen">¥</span><span className="p-big">{formatPrice(featuredItem.guessPrice)}</span> 起
                  </div>
                </div>
                <button className="m-hero-promo-cta" type="button" onClick={(event) => { event.stopPropagation(); router.push(`/product/${featuredItem.id}`); }}>
                  立即参与 &gt;
                </button>
              </div>
            </div>
            <div className="m-hero-info" onClick={() => router.push(`/product/${featuredItem.id}`)}>
              <div className="m-hero-brand-row">
                <div className="m-hero-brand-av">{buildBrandAvatarText(featuredItem.brand)}</div>
                <div className="m-hero-brand-text">
                  <div className="m-hero-brand-name">{featuredItem.brand}</div>
                  <div className="m-hero-brand-sub">{featuredItem.name}</div>
                </div>
              </div>
              <div className="m-hero-details">
                <div><span className="dicon">✅</span> {buildHeroPrimaryLine(featuredItem)}</div>
                <div><span className="dicon">✅</span> {buildHeroSecondaryLine(featuredItem)}</div>
              </div>
              <div className="m-hero-progress">
                <span>已售 {formatSales(featuredItem.sales)}</span>
                <div className="m-hero-bar">
                  <div className="m-hero-bar-fill" style={{ width: `${heroProgress}%` }} />
                </div>
                <span>库存 {formatSales(featuredItem.stock)}</span>
              </div>
              <div className="m-hero-meta">
                {heroMeta.map((value, index) => (
                  <span className="m-hero-meta-chip" key={`${value}-${index}`}>{value}</span>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {loading || (contentTab === 'category' && activeCategory !== 'all' && categoryLoading && !categoryItems[activeCategory]) ? (
          <div className="m-load-more">正在加载商品...</div>
        ) : null}
        {!loading && activeCategoryError ? (
          <div className="m-state-card m-state-card-error">
            <div className="m-state-title">分类商品加载失败</div>
            <div className="m-state-desc">{activeCategoryError}</div>
            <button
              className="m-state-action"
              type="button"
              onClick={() => setCategoryReloadToken((current) => current + 1)}
            >
              重试
            </button>
          </div>
        ) : null}
        {!loading &&
        !productError &&
        !activeCategoryError &&
        !(contentTab === 'category' && activeCategory !== 'all' && categoryLoading && !categoryItems[activeCategory]) &&
        filteredItems.length === 0 ? (
          <div className="m-load-more">当前分类暂无商品</div>
        ) : null}
        {!loading && !productError && !activeCategoryError && visibleGridItems.length > 0 ? (
          <div className={`m-grid ${useInlinePairGrid ? 'm-grid-inline-pair' : ''}`}>{gridNodes}</div>
        ) : null}

        {contentTab === 'recommend' && bannerItem && hasLoadedMore ? (
          <div className="m-banner mfc-enter" onClick={() => router.push(`/product/${bannerItem.id}`)} style={{ animationDelay: '0.08s' }}>
            <div className="m-banner-img">
              <div className="m-banner-center">
                <div className="m-banner-collab">{buildCollabTitle(bannerItem)}</div>
                <div className="m-banner-sub">{buildBannerSubtitle(bannerItem)}</div>
                <button
                  className="m-banner-cta"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(`/product/${bannerItem.id}`);
                  }}
                >
                  立即参与 →
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {!loading && !productError && filteredItems.length > 0 ? (
        <div
          className={`m-load-more ${hasMore ? '' : 'is-disabled'}`}
          id="mLoadMore"
          onClick={() => hasMore && setShowAll(true)}
        >
          {hasMore ? '加载更多好物 ↓' : '— 已经到底啦 —'}
        </div>
      ) : null}

      <div style={{ height: 24 }} />
    </main>
  );
}
