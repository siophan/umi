import { LegacyPage } from '../../components/legacy-page';

export default function AddProductPage() {
  return (
    <LegacyPage
      title="添加商品"
      eyebrow="ADD PRODUCT"
      heroDesc="这个页面对应老系统 add-product，先保留商品录入、图库、规格和价格区块的入口感。"
      heroTitle="录入新商品到你的店铺"
      stats={[
        { value: '6', label: '必填模块' },
        { value: '3', label: '上架模式' },
        { value: '图文', label: '当前草稿' },
      ]}
      listItems={[
        { icon: 'fa-solid fa-image', title: '商品图库', desc: '封面、轮播、详情图与主视觉', gradient: 'linear-gradient(135deg,#AB47BC,#8E24AA)' },
        { icon: 'fa-solid fa-tag', title: '价格与库存', desc: '售价、划线价、库存、竞猜价', gradient: 'linear-gradient(135deg,#FF7043,#E64A19)' },
        { icon: 'fa-solid fa-layer-group', title: '规格与分类', desc: 'SKU、品牌、分类、标签', gradient: 'linear-gradient(135deg,#42A5F5,#1E88E5)' },
      ]}
      listTitle="表单模块"
    />
  );
}
