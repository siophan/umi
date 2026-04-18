import { LegacyPage } from '../../components/legacy-page';

export default function CartPage() {
  return (
    <LegacyPage
      title="购物车"
      eyebrow="CART"
      heroDesc="保留老系统浅色购物流程风格，当前先用静态车内数据承载视觉结构。"
      heroTitle="待结算商品清单"
      stats={[
        { value: '5', label: '已加购商品' },
        { value: '¥213', label: '当前小计' },
        { value: '2', label: '优惠可用' },
      ]}
      listItems={[
        { icon: 'fa-solid fa-bag-shopping', title: '联名零食礼盒', desc: '支持直接购买 / 竞猜转订单', gradient: 'linear-gradient(135deg,#FF7043,#E64A19)' },
        { icon: 'fa-solid fa-truck-fast', title: '运费与配送', desc: '展示包邮门槛、配送时效和收货地址', gradient: 'linear-gradient(135deg,#42A5F5,#1E88E5)' },
        { icon: 'fa-solid fa-percent', title: '优惠与凑单', desc: '优惠券、活动折扣、满减提示', gradient: 'linear-gradient(135deg,#66BB6A,#43A047)' },
      ]}
      listTitle="页面内容"
    />
  );
}
