import { LegacyPage } from '../../../components/legacy-page';

export default function LiveDetailPage() {
  return (
    <LegacyPage
      title="直播间"
      eyebrow="LIVE ROOM"
      heroDesc="直播详情页先保留老系统视频区、主播区、竞猜入口、商品区的版式分层，后续再接真实流。"
      heroTitle="主播实时带货竞猜"
      stats={[
        { value: '2.1万', label: '观看中' },
        { value: '3', label: '当前竞猜' },
        { value: '12', label: '上架商品' },
      ]}
      listItems={[
        { icon: 'fa-solid fa-user', title: '主播信息区', desc: '头像、粉丝数、开播状态、关注按钮', gradient: 'linear-gradient(135deg,#42A5F5,#1E88E5)' },
        { icon: 'fa-solid fa-gift', title: '竞猜挂件区', desc: '边看边猜、赔率展示、直播专属玩法', gradient: 'linear-gradient(135deg,#FF9800,#FF5722)' },
        { icon: 'fa-solid fa-cart-shopping', title: '商品挂车区', desc: '在播商品、限时价格、下单入口', gradient: 'linear-gradient(135deg,#66BB6A,#43A047)' },
      ]}
      listTitle="页面模块"
    />
  );
}
