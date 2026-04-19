'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductCategoryItem, ProductFeedItem } from '@joy/shared';

import { fetchProductList } from '../lib/api';

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

type HeroParticipant = {
  src: string;
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

function formatPrice(value: number) {
  return value.toFixed(value % 1 === 0 ? 0 : 1);
}

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

function splitCollabLabel(item: ProductFeedItem) {
  const collabText = item.collab?.trim() || `${item.brand} × 优米`;
  const parts = collabText.split(/\s*[×xX✕]\s*/);
  return {
    left: parts[0] || item.brand,
    right: (parts[1] || 'JOY').toUpperCase(),
  };
}

function buildCollabTitle(item: ProductFeedItem) {
  return item.collab?.trim() || `${item.brand.toUpperCase()} × JOY`;
}

function splitDisplayCollab(item: ProductFeedItem) {
  const title = buildCollabTitle(item);
  const parts = title.split(/\s*[×xX✕]\s*/);
  return {
    left: parts[0] || item.brand.toUpperCase(),
    right: parts[1] || 'JOY',
  };
}

function buildCollabSubtitle(item: ProductFeedItem) {
  return item.tags[1] || item.tags[0] || item.name;
}

function buildBrandLogoText(brand: string) {
  const normalized = brand.trim().toUpperCase();
  if (!normalized) {
    return 'JOY';
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

function buildBrandAvatarUrl(brand: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(brand)}&backgroundColor=e53935`;
}

function normalizeBrandKey(brand: string) {
  return brand.trim().toUpperCase().replace(/[^A-Z0-9\u4E00-\u9FA5]+/g, '');
}

function buildHeroBrandName(item: ProductFeedItem) {
  const brandKey = normalizeBrandKey(item.brand);
  const aliasMap: Record<string, string> = {
    MAC: 'MAC 魅可',
    DIOR: 'DIOR 迪奥',
    CHANEL: 'CHANEL 香奈儿',
    LANCOME: 'LANCOME 兰蔻',
    YSL: 'YSL 圣罗兰',
    ESTEELAUDER: 'ESTEE LAUDER 雅诗兰黛',
    CELINE: 'CELINE',
    VERSACE: 'VERSACE',
  };

  if (aliasMap[brandKey]) {
    return aliasMap[brandKey];
  }
  if (/[\u4E00-\u9FA5]/.test(item.brand)) {
    return item.brand;
  }
  if (item.category.includes('美妆') || item.category.includes('护肤') || item.name.includes('口红')) {
    return `${item.brand.toUpperCase()} 品牌馆`;
  }
  return `${item.brand} 优选`;
}

function buildHeroSampleText(item: ProductFeedItem) {
  if (item.name.includes('口红') || item.name.includes('唇')) {
    return '1.8g 试用装';
  }
  if (item.category.includes('美妆') || item.category.includes('护肤')) {
    return '体验装';
  }
  if (item.category.includes('食品') || item.category.includes('饮料') || item.category.includes('零食')) {
    return '尝鲜装';
  }
  if (item.category.includes('潮玩') || item.category.includes('盲盒')) {
    return '限量周边';
  }
  if (item.category.includes('数码')) {
    return '热门体验礼';
  }
  return '精选体验装';
}

function buildHeroPrizeName(item: ProductFeedItem) {
  if (item.name.includes('口红') || item.name.includes('唇')) {
    return '正装口红';
  }
  if (item.category.includes('美妆') || item.category.includes('护肤')) {
    return '正装礼盒';
  }
  if (item.category.includes('食品') || item.category.includes('饮料') || item.category.includes('零食')) {
    return '零食大礼包';
  }
  if (item.category.includes('潮玩') || item.category.includes('盲盒')) {
    return '限定盲盒';
  }
  if (item.category.includes('数码')) {
    return '新品套装';
  }
  return '正装商品';
}

function buildHeroParticipants(item: ProductFeedItem, bannerItem: ProductFeedItem | null, collabItem: ProductFeedItem | null): HeroParticipant[] {
  const avatarSeeds = ['Taylor', 'Swift', 'Ruby', 'Velvet', 'Woo', 'Scarlet'];
  return avatarSeeds.map((seed) => ({
    src: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`,
  }));
}

function buildHeroProgress(item: ProductFeedItem) {
  const base = item.sales + item.stock;
  if (base <= 0) {
    return 18;
  }
  return Math.min(96, Math.max(18, Math.round((item.sales / base) * 100)));
}

function buildHeroRemainingText(endAt: number | null, now: number) {
  if (!endAt) {
    return '--';
  }
  const diff = endAt - now;
  if (diff <= 0) {
    return '已结束';
  }
  const dayCount = Math.floor(diff / 86400000);
  const hourCount = Math.floor((diff % 86400000) / 3600000);
  const minuteCount = Math.floor((diff % 3600000) / 60000);
  const secondCount = Math.floor((diff % 60000) / 1000);

  if (dayCount > 0) {
    return `${dayCount}天 ${String(hourCount).padStart(2, '0')}小时`;
  }

  return `${String(hourCount).padStart(2, '0')}:${String(minuteCount).padStart(2, '0')}:${String(secondCount).padStart(2, '0')}`;
}

function buildHeroPrimaryLine(item: ProductFeedItem) {
  return `支付 ¥${formatPrice(item.guessPrice)} 享 ${buildHeroSampleText(item)} + 品牌礼遇`;
}

function buildHeroSecondaryLine(item: ProductFeedItem) {
  return `参与抽奖赢取 ¥${formatPrice(item.price)} ${buildHeroPrizeName(item)}（共100份）`;
}

function buildBannerSubtitle(item: ProductFeedItem) {
  return `猜对${item.brand}人气好物，赢${item.tags[0] || '新品礼盒'}🎁`;
}

function buildHeroPromoSecondary(item: ProductFeedItem) {
  return `抽<span class="p-tag">正装</span> <span class="p-yen">¥</span><span class="p-val">${formatPrice(item.price)}</span>`;
}

function buildGridHeight(item: ProductFeedItem, index: number) {
  return item.height || LEGACY_GRID_HEIGHTS[index % LEGACY_GRID_HEIGHTS.length];
}

function applyLegacyGridMeta(items: ProductFeedItem[]) {
  return items.map((item, index) => ({
    ...item,
    height: LEGACY_GRID_HEIGHTS[index % LEGACY_GRID_HEIGHTS.length],
  }));
}

export function MallHome() {
  const router = useRouter();
  const [mallItems, setMallItems] = useState<ProductFeedItem[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategoryItem[]>([]);
  const [categoryItems, setCategoryItems] = useState<Record<string, ProductFeedItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [feedAnimating, setFeedAnimating] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<MallTab>('recommend');
  const [contentTab, setContentTab] = useState<MallTab>('recommend');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState<MallSort>('default');
  const [seckillSeconds, setSeckillSeconds] = useState(2 * 3600 + 59 * 60 + 48);
  const [countdownNow, setCountdownNow] = useState(Date.now());

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const result = await fetchProductList(50);
        if (!ignore) {
          setMallItems(applyLegacyGridMeta(result.items));
          setProductCategories(result.categories);
        }
      } catch {
        if (!ignore) {
          setMallItems([]);
          setProductCategories([]);
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
  }, []);

  useEffect(() => {
    if (contentTab !== 'seckill') return undefined;
    const initial = 2 * 3600 + 59 * 60 + 48;
    setSeckillSeconds(initial);
    let total = initial;
    const timer = window.setInterval(() => {
      total -= 1;
      if (total <= 0) {
        window.clearInterval(timer);
        setSeckillSeconds(0);
        return;
      }
      setSeckillSeconds(total);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [contentTab]);

  useEffect(() => {
    if (contentTab !== 'recommend') {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [contentTab]);

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

  const recommendBaseItems = useMemo(
    () =>
      [...mallItems].sort((left, right) => {
        if (right.sales !== left.sales) {
          return right.sales - left.sales;
        }
        if (right.rating !== left.rating) {
          return right.rating - left.rating;
        }
        return right.discountAmount - left.discountAmount;
      }),
    [mallItems],
  );

  const activeCategoryItems = activeCategory === 'all' ? mallItems : (categoryItems[activeCategory] ?? []);

  useEffect(() => {
    if (contentTab !== 'category' || activeCategory === 'all' || categoryItems[activeCategory]) {
      return;
    }

    let ignore = false;
    setCategoryLoading(true);

    async function loadCategoryItems() {
      try {
        const result = await fetchProductList({ limit: 50, categoryId: activeCategory });
        if (!ignore) {
          setCategoryItems((current) => ({ ...current, [activeCategory]: applyLegacyGridMeta(result.items) }));
          setProductCategories(result.categories);
        }
      } catch {
        if (!ignore) {
          setCategoryItems((current) => ({ ...current, [activeCategory]: [] }));
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
  }, [activeCategory, categoryItems, contentTab]);

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
    return explicit.length ? explicit : mallItems.slice(0, 4);
  }, [mallItems]);
  const gridStartIndex = contentTab === 'recommend' ? 1 : 0;
  const totalGridItems = filteredItems.slice(gridStartIndex);
  const shouldPaginate = contentTab === 'recommend';
  const visibleGridItems = shouldPaginate && !showAll ? totalGridItems.slice(0, 11) : totalGridItems;
  const hasMore = shouldPaginate && totalGridItems.length > visibleGridItems.length;
  const hasLoadedMore = shouldPaginate && showAll;
  const useInlinePairGrid = contentTab !== 'recommend' && visibleGridItems.length > 0 && visibleGridItems.length <= 2;

  const seckillCountdown = useMemo(() => {
    const hours = Math.floor(seckillSeconds / 3600);
    const minutes = Math.floor((seckillSeconds % 3600) / 60);
    const seconds = seckillSeconds % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0'));
  }, [seckillSeconds]);

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

  function toggleFavorite(productId: string) {
    setFavoriteIds((current) => (
      current.includes(productId)
        ? current.filter((item) => item !== productId)
        : [...current, productId]
    ));
  }

  const tabBanner =
    contentTab === 'seckill' ? (
      <div className="m-tab-banner" style={{ background: 'linear-gradient(135deg,#FF3D00,#FF6D00)' }}>
        <span className="mtb-icon">⚡</span>
        <span className="mtb-text">限时秒杀 · {filteredItems.length}款折扣商品</span>
        <span className="mtb-countdown" id="mSeckillTimer">
          <span>{seckillCountdown[0]}</span>:<span>{seckillCountdown[1]}</span>:<span>{seckillCountdown[2]}</span>
        </span>
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
    const liked = favoriteIds.includes(item.id);

    return (
      <article
        className="m-card mfc-enter"
        key={item.id}
        onClick={() => router.push(`/product/${item.id}`)}
        style={{ animationDelay: `${index * 0.04}s` }}
      >
        <div className="m-card-img" style={{ height: buildGridHeight(item, index) }}>
          <img alt={item.name} src={item.img || '/legacy/images/products/p001-lays.jpg'} />
          <button
            className={`m-card-fav ${liked ? 'liked' : ''}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleFavorite(item.id);
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
  const heroParticipants = featuredItem ? buildHeroParticipants(featuredItem, bannerItem, collabPool[0] ?? null) : [];
  const heroEndsAt = useMemo(() => {
    if (!featuredItem) {
      return null;
    }
    return Date.now() + 86400000 * 2 + 36000000;
  }, [featuredItem?.id]);

  return (
    <main className="mall-home">
      <div className="m-nav">
        <div className="m-logo">
          <span className="m-logo-main">优米</span>
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
            <span className="m-ico-badge">5</span>
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
        {tabBanner}

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
                <img
                  alt={featuredItem.brand}
                  className="m-hero-brand-av"
                  src={buildBrandAvatarUrl(featuredItem.brand)}
                />
                <div className="m-hero-brand-text">
                  <div className="m-hero-brand-name">{buildHeroBrandName(featuredItem)}</div>
                  <div className="m-hero-brand-sub">{featuredItem.name}</div>
                </div>
              </div>
              <div className="m-hero-details">
                <div><span className="dicon">✅</span> {buildHeroPrimaryLine(featuredItem)}</div>
                <div><span className="dicon">✅</span> {buildHeroSecondaryLine(featuredItem)}</div>
              </div>
              <div className="m-hero-progress">
                <span>已参与：{buildHeroProgress(featuredItem)}%</span>
                <div className="m-hero-bar">
                  <div className="m-hero-bar-fill" style={{ width: `${buildHeroProgress(featuredItem)}%` }} />
                </div>
                <span>距离结束：{buildHeroRemainingText(heroEndsAt, countdownNow)}</span>
              </div>
              <div className="m-hero-people">
                <div className="m-hero-avatars">
                  {heroParticipants.map((participant, index) => (
                    <img alt={`participant-${index + 1}`} key={`${participant.src}-${index}`} src={participant.src} />
                  ))}
                </div>
                <span className="m-hero-people-text">{formatSales(featuredItem.sales)}+ 人已参与</span>
              </div>
            </div>
          </section>
        ) : null}

        {loading || (contentTab === 'category' && activeCategory !== 'all' && categoryLoading && !categoryItems[activeCategory]) ? (
          <div className="m-load-more">正在加载商品...</div>
        ) : null}
        {!loading && !(contentTab === 'category' && activeCategory !== 'all' && categoryLoading && !categoryItems[activeCategory]) && filteredItems.length === 0 ? (
          <div className="m-load-more">当前分类暂无商品</div>
        ) : null}
        {!loading && visibleGridItems.length > 0 ? <div className={`m-grid ${useInlinePairGrid ? 'm-grid-inline-pair' : ''}`}>{gridNodes}</div> : null}

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

      {!loading && filteredItems.length > 0 ? (
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
