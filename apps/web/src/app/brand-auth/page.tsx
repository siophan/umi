import { LegacyPage } from '../../components/legacy-page';

export default function BrandAuthPage() {
  return (
    <LegacyPage
      title="品牌授权"
      eyebrow="BRAND AUTH"
      heroDesc="承接老系统品牌授权申请页，先保留证件、审核、结果展示的页面框架。"
      heroTitle="认证品牌身份与合作资质"
      stats={[
        { value: '3', label: '已授权品牌' },
        { value: '1', label: '审核中' },
        { value: '通过', label: '当前状态' },
      ]}
      listItems={[
        { icon: 'fa-solid fa-file-signature', title: '提交品牌资料', desc: '营业执照、品牌证明、联系人信息', gradient: 'linear-gradient(135deg,#FF9800,#FF5722)' },
        { icon: 'fa-solid fa-shield-halved', title: '审核流程', desc: '平台审核进度与结果状态展示', gradient: 'linear-gradient(135deg,#42A5F5,#1E88E5)' },
        { icon: 'fa-solid fa-certificate', title: '合作权益', desc: '通过后可创建品牌竞猜与活动页', gradient: 'linear-gradient(135deg,#66BB6A,#43A047)' },
      ]}
      listTitle="页面能力"
    />
  );
}
