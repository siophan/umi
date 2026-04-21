import type { AdminCouponTemplateItem } from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, ConfigProvider } from 'antd';

import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface AdminCouponTableProps {
  rows: AdminCouponTemplateItem[];
  columns: ProColumns<AdminCouponTemplateItem>[];
  loading: boolean;
  onReload: () => void;
  onCreate: () => void;
}

export function AdminCouponTable({
  rows,
  columns,
  loading,
  onReload,
  onCreate,
}: AdminCouponTableProps) {
  return (
    <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
      <ProTable<AdminCouponTemplateItem>
        cardBordered={false}
        rowKey="id"
        columns={columns}
        columnsState={{
          persistenceKey: 'admin-marketing-coupons-table',
          persistenceType: 'localStorage',
        }}
        dataSource={rows}
        loading={loading}
        options={{
          reload: onReload,
          density: true,
          fullScreen: false,
          setting: true,
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        search={false}
        toolBarRender={() => [
          <Button key="create" type="primary" onClick={onCreate}>
            新增
          </Button>,
        ]}
      />
    </ConfigProvider>
  );
}
