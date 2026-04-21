import { Alert, Empty } from 'antd';

interface LiveDanmakuPageProps {
  refreshToken?: number;
}

export function LiveDanmakuPage(_props: LiveDanmakuPageProps) {
  return (
    <div className="page-stack">
      <Alert
        showIcon
        type="info"
        message="当前系统未承接直播弹幕持久化数据"
        description="现有库只有 live 主表，没有独立的弹幕 / 直播消息表。这里不再展示假数据，待真实数据链路补齐后再接管理页。"
      />
      <div
        style={{
          minHeight: 260,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Empty description="暂无可管理的弹幕数据" />
      </div>
    </div>
  );
}
