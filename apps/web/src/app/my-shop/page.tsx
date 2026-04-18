import { LegacyPage } from '../../components/legacy-page';

export default function MyShopPage() {
  return (
    <LegacyPage
      title="我的店铺"
      eyebrow="SHOP DASHBOARD"
      heroDesc="对齐老系统 myshop 的店铺后台视觉，先把店铺数据卡、商品管理和运营入口放回来。"
      heroTitle="店铺经营数据总览"
      stats={[
        { value: '892', label: '总订单' },
        { value: '96.4%', label: '好评率' },
        { value: '128', label: '在售商品' },
      ]}
      gridItems={[
        { icon: 'fa-solid fa-box', label: '商品管理', gradient: 'linear-gradient(135deg,#4E6AE6,#6C7BFF)' },
        { icon: 'fa-solid fa-rectangle-ad', label: '活动海报', gradient: 'linear-gradient(135deg,#FF9800,#FF5722)' },
        { icon: 'fa-solid fa-receipt', label: '订单处理', gradient: 'linear-gradient(135deg,#66BB6A,#43A047)' },
        { icon: 'fa-solid fa-chart-line', label: '经营分析', gradient: 'linear-gradient(135deg,#AB47BC,#8E24AA)' },
      ]}
      gridTitle="店铺入口"
    />
  );
}
