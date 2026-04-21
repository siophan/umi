import { toEntityId } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { inferCarrier, mapLogisticsStatus, toMoney, toNullableIso, toShippingType, toShippingTypeLabel, } from './orders-shared';
export async function getAdminLogistics() {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        fo.id,
        fo.fulfillment_sn,
        fo.type,
        fo.status,
        fo.user_id,
        fo.order_id,
        o.order_sn,
        fo.receiver_name,
        fo.phone_number,
        fo.shipping_type,
        fo.shipping_fee,
        fo.total_amount,
        fo.tracking_no,
        fo.created_at,
        fo.shipped_at,
        fo.completed_at,
        GROUP_CONCAT(DISTINCT COALESCE(p.name, bp.name) ORDER BY foi.id SEPARATOR ' / ') AS product_summary
      FROM fulfillment_order fo
      LEFT JOIN \`order\` o ON o.id = fo.order_id
      LEFT JOIN fulfillment_order_item foi ON foi.fulfillment_order_id = fo.id
      LEFT JOIN product p ON p.id = foi.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      GROUP BY
        fo.id,
        fo.fulfillment_sn,
        fo.type,
        fo.status,
        fo.user_id,
        fo.order_id,
        o.order_sn,
        fo.receiver_name,
        fo.phone_number,
        fo.shipping_type,
        fo.shipping_fee,
        fo.total_amount,
        fo.tracking_no,
        fo.created_at,
        fo.shipped_at,
        fo.completed_at
      ORDER BY COALESCE(fo.shipped_at, fo.created_at) DESC, fo.id DESC
    `);
    return rows.map((row) => {
        const shippingType = toShippingType(row.shipping_type);
        const { carrier, derived } = inferCarrier(shippingType, row.tracking_no);
        const status = mapLogisticsStatus(Number(row.status ?? 0));
        return {
            id: String(toEntityId(row.id)),
            fulfillmentSn: row.fulfillment_sn,
            orderId: row.order_id ? String(toEntityId(row.order_id)) : null,
            orderSn: row.order_sn,
            userId: String(toEntityId(row.user_id)),
            receiver: row.receiver_name,
            phoneNumber: row.phone_number,
            carrier,
            carrierDerived: derived,
            trackingNo: row.tracking_no,
            shippingType,
            shippingTypeLabel: toShippingTypeLabel(shippingType),
            shippingFee: toMoney(row.shipping_fee),
            totalAmount: toMoney(row.total_amount),
            status: status.status,
            statusLabel: status.statusLabel,
            productSummary: row.product_summary || '待补明细',
            createdAt: new Date(row.created_at).toISOString(),
            shippedAt: toNullableIso(row.shipped_at),
            completedAt: toNullableIso(row.completed_at),
        };
    });
}
export async function getAdminLogisticsDetail(logisticsId) {
    const items = await getAdminLogistics();
    const matched = items.find((item) => item.id === logisticsId);
    if (!matched) {
        throw new HttpError(404, 'ADMIN_LOGISTICS_NOT_FOUND', '物流记录不存在');
    }
    return matched;
}
