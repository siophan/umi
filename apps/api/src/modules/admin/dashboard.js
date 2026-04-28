import { getDbPool } from '../../lib/db';
const GUESS_PENDING_REVIEW = 10;
const GUESS_APPROVED = 30;
const GUESS_ACTIVE = 30;
const ORDER_PENDING = 10;
const ORDER_PAID = 20;
const ORDER_FULFILLED = 30;
const ORDER_CLOSED = 40;
const ORDER_REFUNDED = 90;
const PRODUCT_STATUS_ACTIVE = 10;
const PRODUCT_STATUS_OFF_SHELF = 20;
const PRODUCT_STATUS_DISABLED = 90;
const SHOP_APPLY_PENDING = 10;
const REFUND_PENDING = 10;
const REFUND_REVIEWING = 20;
const REPORT_PENDING = 10;
const REPORT_REVIEWING = 20;
const TREND_DAYS = 7;
const ORDER_STATUS_LABELS = {
    [ORDER_PENDING]: '待支付',
    [ORDER_PAID]: '已支付',
    [ORDER_FULFILLED]: '已完成',
    [ORDER_CLOSED]: '已关闭',
    [ORDER_REFUNDED]: '已退款',
};
function startOfDay(date) {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
}
function toNumber(value) {
    return Number(value ?? 0);
}
function mapProductStatus(code) {
    if (code === PRODUCT_STATUS_ACTIVE) {
        return 'active';
    }
    if (code === PRODUCT_STATUS_OFF_SHELF) {
        return 'off_shelf';
    }
    if (code === PRODUCT_STATUS_DISABLED) {
        return 'disabled';
    }
    return 'unknown';
}
function buildTrendDates() {
    const out = [];
    const today = startOfDay(new Date());
    for (let i = TREND_DAYS - 1; i >= 0; i -= 1) {
        const day = new Date(today);
        day.setDate(day.getDate() - i);
        const yyyy = day.getFullYear();
        const mm = String(day.getMonth() + 1).padStart(2, '0');
        const dd = String(day.getDate()).padStart(2, '0');
        out.push({
            iso: `${yyyy}-${mm}-${dd}`,
            label: `${day.getMonth() + 1}/${day.getDate()}`,
        });
    }
    return out;
}
function bucketByDay(rows) {
    const map = new Map();
    for (const row of rows) {
        map.set(String(row.day), toNumber(row.total));
    }
    return map;
}
export async function getAdminDashboardStats() {
    const db = getDbPool();
    const todayStart = startOfDay(new Date());
    const trendDates = buildTrendDates();
    const trendStart = new Date(`${trendDates[0].iso}T00:00:00`);
    const [[userRows], [productRows], [activeGuessRows], [orderRows], [todayUserRows], [todayBetRows], [todayOrderRows], [todayPaidGmvRows], [todayRefundGmvRows], [orderDistributionRows], [guessCategoryRows], [hotGuessRows], [hotProductRows], [pendingGuessRows], [pendingShopApplyRows], [pendingRefundRows], [pendingReportRows], [trendUserRows], [trendOrderRows], [trendBetRows], [trendPaidRows], [trendRefundRows],] = await Promise.all([
        db.execute('SELECT COUNT(*) AS total FROM user'),
        db.execute('SELECT COUNT(*) AS total FROM product'),
        db.execute(`
        SELECT COUNT(*) AS total
        FROM guess
        WHERE status = ?
          AND review_status = ?
      `, [GUESS_ACTIVE, GUESS_APPROVED]),
        db.execute('SELECT COUNT(*) AS total FROM `order`'),
        db.execute('SELECT COUNT(*) AS total FROM user WHERE created_at >= ?', [todayStart]),
        db.execute('SELECT COUNT(*) AS total FROM guess_bet WHERE created_at >= ?', [todayStart]),
        db.execute('SELECT COUNT(*) AS total FROM `order` WHERE created_at >= ?', [todayStart]),
        db.execute(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM \`order\`
        WHERE created_at >= ?
          AND status IN (?, ?)
      `, [todayStart, ORDER_PAID, ORDER_FULFILLED]),
        db.execute(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM \`order\`
        WHERE created_at >= ?
          AND status = ?
      `, [todayStart, ORDER_REFUNDED]),
        db.execute('SELECT status, COUNT(*) AS total FROM `order` GROUP BY status'),
        db.execute(`
        SELECT COALESCE(c.name, '未分类') AS label, COUNT(*) AS value
        FROM guess g
        LEFT JOIN category c ON c.id = g.category_id
        GROUP BY COALESCE(c.name, '未分类')
        ORDER BY value DESC, label ASC
        LIMIT 6
      `),
        db.execute(`
        SELECT
          g.id,
          g.title,
          g.end_time,
          COALESCE(c.name, '未分类') AS category_name,
          COUNT(gb.id) AS participant_count,
          COALESCE(SUM(gb.amount), 0) AS total_pool
        FROM guess g
        LEFT JOIN category c ON c.id = g.category_id
        LEFT JOIN guess_bet gb ON gb.guess_id = g.id
        WHERE g.review_status = ?
          AND g.status = ?
        GROUP BY g.id
        ORDER BY participant_count DESC, total_pool DESC, g.created_at DESC
        LIMIT 5
      `, [GUESS_APPROVED, GUESS_ACTIVE]),
        db.execute(`
        SELECT
          p.id,
          p.name,
          p.image_url,
          p.price,
          p.status,
          p.stock,
          MAX(p.sales) AS p_sales,
          COALESCE(SUM(CASE WHEN o.id IS NOT NULL THEN oi.quantity ELSE 0 END), 0) AS sales_count
        FROM product p
        LEFT JOIN order_item oi ON oi.product_id = p.id
        LEFT JOIN \`order\` o
          ON o.id = oi.order_id
         AND o.status IN (?, ?)
        GROUP BY p.id
        ORDER BY sales_count DESC, p_sales DESC, p.updated_at DESC
        LIMIT 5
      `, [ORDER_PAID, ORDER_FULFILLED]),
        db.execute(`
        SELECT COUNT(*) AS total
        FROM guess
        WHERE review_status = ?
      `, [GUESS_PENDING_REVIEW]),
        db.execute(`
        SELECT COUNT(*) AS total
        FROM shop_apply
        WHERE status = ?
      `, [SHOP_APPLY_PENDING]),
        db.execute(`
        SELECT COUNT(*) AS total
        FROM order_refund
        WHERE status IN (?, ?)
      `, [REFUND_PENDING, REFUND_REVIEWING]),
        db.execute(`
        SELECT COUNT(*) AS total
        FROM report_item
        WHERE status IN (?, ?)
      `, [REPORT_PENDING, REPORT_REVIEWING]),
        db.execute(`
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS total
        FROM user
        WHERE created_at >= ?
        GROUP BY day
      `, [trendStart]),
        db.execute(`
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS total
        FROM \`order\`
        WHERE created_at >= ?
        GROUP BY day
      `, [trendStart]),
        db.execute(`
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS total
        FROM guess_bet
        WHERE created_at >= ?
        GROUP BY day
      `, [trendStart]),
        db.execute(`
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COALESCE(SUM(amount), 0) AS total
        FROM \`order\`
        WHERE created_at >= ?
          AND status IN (?, ?)
        GROUP BY day
      `, [trendStart, ORDER_PAID, ORDER_FULFILLED]),
        db.execute(`
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COALESCE(SUM(amount), 0) AS total
        FROM \`order\`
        WHERE created_at >= ?
          AND status = ?
        GROUP BY day
      `, [trendStart, ORDER_REFUNDED]),
    ]);
    const trendUserMap = bucketByDay(trendUserRows);
    const trendOrderMap = bucketByDay(trendOrderRows);
    const trendBetMap = bucketByDay(trendBetRows);
    const trendPaidMap = bucketByDay(trendPaidRows);
    const trendRefundMap = bucketByDay(trendRefundRows);
    const trend = trendDates.map(({ iso, label }) => ({
        date: label,
        users: trendUserMap.get(iso) ?? 0,
        orders: trendOrderMap.get(iso) ?? 0,
        bets: trendBetMap.get(iso) ?? 0,
        gmv: Math.max((trendPaidMap.get(iso) ?? 0) - (trendRefundMap.get(iso) ?? 0), 0),
    }));
    const todayPaidGmv = toNumber(todayPaidGmvRows[0]?.total);
    const todayRefundGmv = toNumber(todayRefundGmvRows[0]?.total);
    const todayGmv = Math.max(todayPaidGmv - todayRefundGmv, 0);
    const orderDistribution = orderDistributionRows
        .map((row) => {
        const status = toNumber(row.status);
        const label = ORDER_STATUS_LABELS[status] ?? `状态(${status})`;
        return { type: label, value: toNumber(row.total) };
    })
        .sort((a, b) => b.value - a.value);
    const pendingQueues = [
        {
            id: 'pending-guesses',
            title: '待审核竞猜',
            count: toNumber(pendingGuessRows[0]?.total),
            tone: 'warning',
            description: '需要运营或风控完成审核后才能进入正式流转。',
        },
        {
            id: 'shop-apply',
            title: '开店申请',
            count: toNumber(pendingShopApplyRows[0]?.total),
            tone: 'processing',
            description: '新店入驻申请待处理。',
        },
        {
            id: 'refund-review',
            title: '退款审核',
            count: toNumber(pendingRefundRows[0]?.total),
            tone: 'error',
            description: '退款单正在等待审核或处理中。',
        },
        {
            id: 'report-review',
            title: '举报处理',
            count: toNumber(pendingReportRows[0]?.total),
            tone: 'error',
            description: '社区举报单待处理或处理中。',
        },
    ];
    return {
        generatedAt: new Date().toISOString(),
        users: toNumber(userRows[0]?.total),
        products: toNumber(productRows[0]?.total),
        activeGuesses: toNumber(activeGuessRows[0]?.total),
        orders: toNumber(orderRows[0]?.total),
        todayUsers: toNumber(todayUserRows[0]?.total),
        todayBets: toNumber(todayBetRows[0]?.total),
        todayOrders: toNumber(todayOrderRows[0]?.total),
        todayGmv,
        trend,
        orderDistribution,
        guessCategories: guessCategoryRows.map((row) => ({
            type: row.label,
            value: toNumber(row.value),
        })),
        hotGuesses: hotGuessRows.map((row) => ({
            id: String(row.id),
            title: row.title,
            category: row.category_name || '未分类',
            participants: toNumber(row.participant_count),
            poolAmount: toNumber(row.total_pool),
            endTime: new Date(row.end_time).toISOString(),
        })),
        hotProducts: hotProductRows.map((row) => ({
            id: String(row.id),
            name: row.name,
            imageUrl: row.image_url,
            price: toNumber(row.price),
            stock: toNumber(row.stock),
            sales: toNumber(row.sales_count),
            status: mapProductStatus(toNumber(row.status)),
        })),
        pendingQueues,
    };
}
