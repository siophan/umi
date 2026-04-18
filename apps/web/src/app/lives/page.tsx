import { LegacyPage } from '../../components/legacy-page';

export default function LivesPage() {
  return (
    <LegacyPage
      title="直播竞猜"
      eyebrow="LIVE FEED"
      heroDesc="这里承接老系统 lives / live 的直播流入口，先保留暗色娱乐内容氛围和功能分组。"
      heroTitle="实时观看与直播竞猜"
      stats={[
        { value: '18', label: '在线直播间' },
        { value: '6.2万', label: '总观看量' },
        { value: '9', label: '进行中竞猜' },
      ]}
      gridItems={[
        { icon: 'fa-solid fa-video', label: '直播间', gradient: 'linear-gradient(135deg,#FF7043,#E64A19)' },
        { icon: 'fa-solid fa-bolt', label: 'PK竞猜', gradient: 'linear-gradient(135deg,#7E57C2,#5E35B1)' },
        { icon: 'fa-solid fa-fire', label: '热门场次', gradient: 'linear-gradient(135deg,#EF5350,#E53935)' },
        { icon: 'fa-solid fa-message', label: '实时弹幕', gradient: 'linear-gradient(135deg,#26C6DA,#00ACC1)' },
      ]}
      gridTitle="直播能力"
      listItems={[
        { icon: 'fa-solid fa-circle-play', title: '直播详情页', desc: '主播信息、商品挂车、竞猜入口', gradient: 'linear-gradient(135deg,#42A5F5,#1E88E5)' },
        { icon: 'fa-solid fa-clock-rotate-left', title: '回放与精彩片段', desc: '保留老系统直播内容沉淀能力', gradient: 'linear-gradient(135deg,#AB47BC,#8E24AA)' },
      ]}
      listTitle="后续细化"
    />
  );
}
