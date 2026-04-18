import { LegacyPage } from '../../components/legacy-page';

export default function TestApiPage() {
  return (
    <LegacyPage
      title="接口测试"
      eyebrow="API TEST"
      heroDesc="测试页先保留开发工具页面的独立入口，后续用来挂接真实接口联调。"
      heroTitle="用户端接口联调面板"
      stats={[
        { value: 'Mock', label: '当前模式' },
        { value: '等待', label: '真实接口' },
        { value: '调试', label: '开发用途' },
      ]}
      listItems={[
        { icon: 'fa-solid fa-plug', title: '接口连接状态', desc: '展示当前 API 环境与返回结果', gradient: 'linear-gradient(135deg,#42A5F5,#1E88E5)' },
        { icon: 'fa-solid fa-code', title: '请求示例', desc: '便于前后端联调和问题复现', gradient: 'linear-gradient(135deg,#FF9800,#FF5722)' },
      ]}
      listTitle="开发区"
    />
  );
}
