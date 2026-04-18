import { LegacyPage } from '../../components/legacy-page';

export default function CreateUserPage() {
  return (
    <LegacyPage
      title="好友竞猜"
      eyebrow="FRIEND GUESS"
      heroDesc="承接老系统 create-user 的好友参战页，先还原邀请、分享、参战人数这些 UI 模块。"
      heroTitle="邀请好友一起开局"
      stats={[
        { value: '4', label: '已邀请好友' },
        { value: '2', label: '已接受' },
        { value: 'PK', label: '当前模式' },
      ]}
      listItems={[
        { icon: 'fa-solid fa-user-group', title: '邀请好友参战', desc: '多种分享方式与参战人数展示', gradient: 'linear-gradient(135deg,#5C6BC0,#7C4DFF)' },
        { icon: 'fa-solid fa-share-nodes', title: '分享海报与口令', desc: '保留老系统邀请裂变样式', gradient: 'linear-gradient(135deg,#FF7043,#E64A19)' },
      ]}
      listTitle="页面能力"
    />
  );
}
