import { getDbPool } from '../../lib/db';
const GUESS_PENDING_REVIEW = 10;
const GUESS_APPROVED = 30;
const GUESS_ACTIVE = 30;
const ORDER_PENDING = 10;
const ORDER_PAID = 20;
const ORDER_FULFILLED = 30;
const ORDER_REFUNDED = 90;
const SHOP_APPLY_PENDING = 10;
const REFUND_PENDING = 10;
const REFUND_REVIEWING = 20;
const REPORT_PENDING = 10;
const REPORT_REVIEWING = 20;
function formatDayLabel(date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
}
function startOfDay(date) {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
}
function endOfDay(date) {
    const value = startOfDay(date);
    value.setDate(value.getDate() + 1);
    return value;
}
function toNumber(value) {
    return Number(value ?? 0);
}
function mapProductStatus(code) {
    if (code === 20) {
        return 'off_shelf';
    }
    if (code === 90) {
        return 'disabled';
    }
    return 'active';
}
export async function getAdminDashboardStats() {
    const db = getDbPool();
    const todayStart = startOfDay(new Date());
    const [[userRows], [productRows], [activeGuessRows], [orderRows], [todayUserRows], [todayBetRows], [todayOrderRows], [todayGmvRows], [orderDistributionRows], [guessCategoryRows], [hotGuessRows], [hotProductRows], [pendingGuessRows], [pendingShopApplyRows], [pendingRefundRows], [pendingReportRows],] = await Promise.all([
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
        SELECT '待支付' AS label, COUNT(*) AS value
        FROM \`order\`
        WHERE status = ?
        UNION ALL
        SELECT '已支付' AS label, COUNT(*) AS value
        FROM \`order\`
        WHERE status = ?
        UNION ALL
        SELECT '已完成' AS label, COUNT(*) AS value
        FROM \`order\`
        WHERE status = ?
        UNION ALL
        SELECT '已退款' AS label, COUNT(*) AS value
        FROM \`order\`
        WHERE status = ?
      `, [ORDER_PENDING, ORDER_PAID, ORDER_FULFILLED, ORDER_REFUNDED]),
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
        GROUP BY g.id, g.title, g.end_time, c.name
        ORDER BY participant_count DESC, total_pool DESC, g.created_at DESC
        LIMIT 5
      `, [GUESS_APPROVED]),
        db.execute(`
        SELECT
          p.id,
          p.name,
          p.image_url,
          p.price,
          p.status,
          p.stock,
          COALESCE(SUM(CASE WHEN o.id IS NOT NULL THEN oi.quantity ELSE 0 END), 0) AS sales_count
        FROM product p
        LEFT JOIN order_item oi ON oi.product_id = p.id
        LEFT JOIN \`order\` o
          ON o.id = oi.order_id
         AND o.status IN (?, ?)
        GROUP BY p.id, p.name, p.image_url, p.price, p.status, p.stock, p.sales
        ORDER BY sales_count DESC, p.sales DESC, p.updated_at DESC
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
    ]);
    const trend = await Promise.all(Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        const rangeStart = startOfDay(date);
        const rangeEnd = endOfDay(date);
        return db
            .execute(`
            SELECT
              (SELECT COUNT(*) FROM user WHERE created_at >= ? AND created_at < ?) AS total_users,
              (SELECT COUNT(*) FROM \`order\` WHERE created_at >= ? AND created_at < ?) AS total_orders,
              (SELECT COUNT(*) FROM guess_bet WHERE created_at >= ? AND created_at < ?) AS total_bets,
              (
                SELECT COALESCE(SUM(amount), 0)
                FROM \`order\`
                WHERE created_at >= ?
                  AND created_at < ?
                  AND status IN (?, ?)
              ) AS total_gmv
          `, [
            rangeStart,
            rangeEnd,
            rangeStart,
            rangeEnd,
            rangeStart,
            rangeEnd,
            rangeStart,
            rangeEnd,
            ORDER_PAID,
            ORDER_FULFILLED,
        ])
            .then(([rows]) => {
            const row = rows[0] ?? {};
            return {
                date: formatDayLabel(date),
                users: toNumber(row.total_users),
                orders: toNumber(row.total_orders),
                bets: toNumber(row.total_bets),
                gmv: toNumber(row.total_gmv),
            };
        });
    }));
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
        todayGmv: toNumber(todayGmvRows[0]?.total),
        trend,
        orderDistribution: orderDistributionRows.map((row) => ({
            type: row.label,
            value: toNumber(row.value),
        })),
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
