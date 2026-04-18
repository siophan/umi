import { LegacyPage } from '../../components/legacy-page';

export default function AiDemoPage() {
  return (
    <LegacyPage
      title="AI 助手演示"
      eyebrow="AI DEMO"
      heroDesc="保留老系统 AI Demo 的实验页定位，先把对话、建议、快捷入口的静态 UI 承起来。"
      heroTitle="优米智能助手"
      stats={[
        { value: '推荐', label: '商品建议' },
        { value: '竞猜', label: '热点分析' },
        { value: '问答', label: '交互模式' },
      ]}
      listItems={[
        { icon: 'fa-solid fa-robot', title: 'AI 问答面板', desc: '对话输入、推荐回复、加载态', gradient: 'linear-gradient(135deg,#7E57C2,#5E35B1)' },
        { icon: 'fa-solid fa-wand-magic-sparkles', title: '智能推荐', desc: '为竞猜、商品、内容生成建议', gradient: 'linear-gradient(135deg,#26C6DA,#00ACC1)' },
      ]}
      listTitle="演示模块"
    />
  );
}
