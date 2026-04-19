import type { ReactNode } from 'react';
import { Alert, Card, Descriptions, Drawer, Form, Input, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type {
  AdminCategoryItem,
  AdminChatItem,
  AdminNotificationItem,
  AdminPermissionMatrixData,
  AdminRoleListItem,
  AdminSystemUserItem,
} from '../lib/admin-data';
import {
  fetchAdminCategories,
  fetchAdminChats,
  fetchAdminNotifications,
  fetchAdminPermissionsMatrix,
  fetchAdminRoles,
  fetchAdminSystemUsers,
} from '../lib/api/system';
import { formatDateTime, formatNumber, formatPercent } from '../lib/format';

type ContentSystemPath =
  | '/community/posts'
  | '/community/comments'
  | '/community/reports'
  | '/live/list'
  | '/live/danmaku'
  | '/system/chats'
  | '/system/users'
  | '/system/roles'
  | '/users/permissions'
  | '/system/categories'
  | '/system/notifications';

interface ContentSystemPageProps {
  path: ContentSystemPath;
  refreshToken?: number;
}

interface ContentSystemPageData {
  chats: AdminChatItem[];
  systemUsers: AdminSystemUserItem[];
  roles: AdminRoleListItem[];
  permissionsMatrix: AdminPermissionMatrixData | null;
  categories: AdminCategoryItem[];
  notifications: AdminNotificationItem[];
}

const emptyPageData: ContentSystemPageData = {
  chats: [],
  systemUsers: [],
  roles: [],
  permissionsMatrix: null,
  categories: [],
  notifications: [],
};

type StaticRow = Record<string, string | number>;
type DetailRecord =
  | StaticRow
  | AdminChatItem
  | AdminSystemUserItem
  | AdminRoleListItem
  | AdminCategoryItem
  | AdminNotificationItem;

interface ContentSystemView {
  title: string;
  metrics: ReactNode;
  rows: DetailRecord[];
  columns: TableColumnsType<DetailRecord>;
}

function statusTag(label: string, color: string) {
  return <Tag color={color}>{label}</Tag>;
}

export function ContentSystemPage({
  path,
  refreshToken = 0,
}: ContentSystemPageProps) {
  const [selected, setSelected] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [data, setData] = useState<ContentSystemPageData>(emptyPageData);
  const [filters, setFilters] = useState<{
    keyword?: string;
    second?: string;
    third?: string;
  }>({});
  const [status, setStatus] = useState('all');
  const [form] = Form.useForm<{ keyword?: string; second?: string; third?: string }>();

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      try {
        if (path === '/system/chats') {
          const chats = await fetchAdminChats().then((result) => result.items);
          if (alive) setData({ ...emptyPageData, chats });
          return;
        }
        if (path === '/system/users') {
          const systemUsers = await fetchAdminSystemUsers().then((result) => result.items);
          if (alive) setData({ ...emptyPageData, systemUsers });
          return;
        }
        if (path === '/system/roles') {
          const roles = await fetchAdminRoles().then((result) => result.items);
          if (alive) setData({ ...emptyPageData, roles });
          return;
        }
        if (path === '/users/permissions') {
          const permissionsMatrix = await fetchAdminPermissionsMatrix();
          if (alive) setData({ ...emptyPageData, permissionsMatrix });
          return;
        }
        if (path === '/system/categories') {
          const categories = await fetchAdminCategories().then((result) => result.items);
          if (alive) setData({ ...emptyPageData, categories });
          return;
        }
        if (path === '/system/notifications') {
          const notifications = await fetchAdminNotifications().then((result) => result.items);
          if (alive) setData({ ...emptyPageData, notifications });
          return;
        }
        if (alive) {
          setData(emptyPageData);
        }
      } catch (error) {
        if (!alive) {
          return;
        }
        setData(emptyPageData);
        setIssue(error instanceof Error ? error.message : '页面数据加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      alive = false;
    };
  }, [path, refreshToken]);

  const postRows: StaticRow[] = [
    { id: 'post-1', title: 'Panda 竞猜晒单', author: '用户 1001', likes: 128, comments: 24, status: '已发布' },
    { id: 'post-2', title: '品牌上新开箱', author: '用户 1008', likes: 92, comments: 13, status: '待复核' },
  ];
  const commentRows: StaticRow[] = [
    { id: 'comment-1', content: '这个竞猜太刺激了', author: '用户 1003', target: 'Panda 竞猜晒单', status: '正常' },
    { id: 'comment-2', content: '请尽快发货', author: '用户 1018', target: '品牌上新开箱', status: '复核中' },
  ];
  const reportRows: StaticRow[] = [
    { id: 'report-1', target: '帖子 post-1', reporter: '用户 1033', reason: '疑似广告', status: '待处理' },
    { id: 'report-2', target: '评论 comment-2', reporter: '用户 1109', reason: '辱骂', status: '处理中' },
  ];
  const liveRows: StaticRow[] = [
    { id: 'live-1', room: '直播间 01', host: '主播 Panda', viewers: 842, status: '直播中' },
    { id: 'live-2', room: '直播间 08', host: '主播 Seven', viewers: 0, status: '已结束' },
  ];
  const danmakuRows: StaticRow[] = [
    { id: 'dm-1', room: '直播间 01', sender: '用户 888', content: '求开奖', risk: '正常' },
    { id: 'dm-2', room: '直播间 01', sender: '用户 999', content: '优惠券还有吗', risk: '待复核' },
  ];

  const view = useMemo<ContentSystemView>(() => {
    switch (path) {
      case '/community/posts': {
        const columns: TableColumnsType<StaticRow> = [
          { title: '帖子标题', dataIndex: 'title' },
          { title: '作者', dataIndex: 'author' },
          { title: '点赞', dataIndex: 'likes', render: formatNumber },
          { title: '评论', dataIndex: 'comments', render: formatNumber },
          { title: '状态', dataIndex: 'status' },
        ];
        return {
          title: '帖子管理',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="帖子数" value={postRows.length} /></Card>
              <Card className="metric-card"><Statistic title="待复核" value={postRows.filter((item) => item.status === '待复核').length} /></Card>
            </>
          ),
          rows: postRows,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
      case '/community/comments': {
        const columns: TableColumnsType<StaticRow> = [
          { title: '评论内容', dataIndex: 'content' },
          { title: '评论人', dataIndex: 'author' },
          { title: '评论对象', dataIndex: 'target' },
          { title: '状态', dataIndex: 'status' },
        ];
        return {
          title: '评论管理',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="评论数" value={commentRows.length} /></Card>
              <Card className="metric-card"><Statistic title="复核中" value={commentRows.filter((item) => item.status === '复核中').length} /></Card>
            </>
          ),
          rows: commentRows,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
      case '/community/reports': {
        const columns: TableColumnsType<StaticRow> = [
          { title: '举报对象', dataIndex: 'target' },
          { title: '举报人', dataIndex: 'reporter' },
          { title: '原因', dataIndex: 'reason' },
          { title: '状态', dataIndex: 'status' },
        ];
        return {
          title: '举报处理',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="举报数" value={reportRows.length} /></Card>
              <Card className="metric-card"><Statistic title="待处理" value={reportRows.filter((item) => item.status === '待处理').length} /></Card>
            </>
          ),
          rows: reportRows,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
      case '/live/list': {
        const columns: TableColumnsType<StaticRow> = [
          { title: '直播间', dataIndex: 'room' },
          { title: '主播', dataIndex: 'host' },
          { title: '观看人数', dataIndex: 'viewers', render: formatNumber },
          { title: '状态', dataIndex: 'status' },
        ];
        return {
          title: '直播列表',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="直播间" value={liveRows.length} /></Card>
              <Card className="metric-card"><Statistic title="直播中" value={liveRows.filter((item) => item.status === '直播中').length} /></Card>
            </>
          ),
          rows: liveRows,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
      case '/live/danmaku': {
        const columns: TableColumnsType<StaticRow> = [
          { title: '直播间', dataIndex: 'room' },
          { title: '发送者', dataIndex: 'sender' },
          { title: '内容', dataIndex: 'content' },
          { title: '风控状态', dataIndex: 'risk' },
        ];
        return {
          title: '弹幕管理',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="弹幕样本" value={danmakuRows.length} /></Card>
              <Card className="metric-card"><Statistic title="待复核" value={danmakuRows.filter((item) => item.risk === '待复核').length} /></Card>
            </>
          ),
          rows: danmakuRows,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
      case '/system/chats': {
        const columns: TableColumnsType<AdminChatItem> = [
          {
            title: '会话双方',
            render: (_, record) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{record.userA.name}</Typography.Text>
                <Typography.Text type="secondary">{record.userB.name}</Typography.Text>
              </Space>
            ),
          },
          { title: '消息数', dataIndex: 'messages', render: formatNumber },
          { title: '未读', dataIndex: 'unreadMessages', render: formatNumber },
          {
            title: '风险等级',
            render: (_, record) =>
              statusTag(
                record.riskLevel === 'high'
                  ? '高风险'
                  : record.riskLevel === 'medium'
                    ? '中风险'
                    : '低风险',
                record.riskLevel === 'high'
                  ? 'error'
                  : record.riskLevel === 'medium'
                    ? 'warning'
                    : 'success',
              ),
          },
          { title: '状态', dataIndex: 'status' },
          { title: '更新时间', dataIndex: 'updatedAt', render: (value) => formatDateTime(value) },
        ];
        return {
          title: '聊天管理',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="会话数" value={data.chats.length} /></Card>
              <Card className="metric-card"><Statistic title="高风险" value={data.chats.filter((item) => item.riskLevel === 'high').length} /></Card>
              <Card className="metric-card"><Statistic title="待复核" value={data.chats.filter((item) => item.status === 'review').length} /></Card>
            </>
          ),
          rows: data.chats,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
      case '/system/users': {
        const columns: TableColumnsType<AdminSystemUserItem> = [
          {
            title: '账号',
            render: (_, record) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{record.username}</Typography.Text>
                <Typography.Text type="secondary">{record.displayName}</Typography.Text>
              </Space>
            ),
          },
          { title: '角色', dataIndex: 'role' },
          { title: '手机号', dataIndex: 'phoneNumber', render: (value) => value || '-' },
          { title: '状态', render: (_, record) => statusTag(record.status === 'active' ? '启用中' : '停用', record.status === 'active' ? 'success' : 'default') },
          { title: '最近登录', dataIndex: 'lastLoginAt', render: (value) => (value ? formatDateTime(value) : '-') },
        ];
        return {
          title: '系统用户',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="账号数" value={data.systemUsers.length} /></Card>
              <Card className="metric-card"><Statistic title="启用中" value={data.systemUsers.filter((item) => item.status === 'active').length} /></Card>
              <Card className="metric-card"><Statistic title="停用" value={data.systemUsers.filter((item) => item.status === 'disabled').length} /></Card>
            </>
          ),
          rows: data.systemUsers,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
      case '/system/roles': {
        const columns: TableColumnsType<AdminRoleListItem> = [
          { title: '角色名', dataIndex: 'name' },
          { title: '编码', dataIndex: 'code' },
          { title: '成员数', dataIndex: 'memberCount', render: formatNumber },
          { title: '权限数', dataIndex: 'permissionCount', render: formatNumber },
          { title: '作用域', dataIndex: 'scope' },
          { title: '状态', render: (_, record) => statusTag(record.status === 'active' ? '启用中' : '停用', record.status === 'active' ? 'success' : 'default') },
        ];
        return {
          title: '角色管理',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="角色数" value={data.roles.length} /></Card>
              <Card className="metric-card"><Statistic title="系统角色" value={data.roles.filter((item) => item.isSystem).length} /></Card>
              <Card className="metric-card"><Statistic title="成员总数" value={data.roles.reduce((sum, item) => sum + item.memberCount, 0)} /></Card>
            </>
          ),
          rows: data.roles,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
      case '/users/permissions': {
        const rows =
          data.permissionsMatrix?.modules.map((module) => ({
            key: module.module,
            module: module.module,
            permissions: module.permissions.length,
            touchedRoles: new Set(module.cells.flatMap((item) => item.permissionCodes)).size,
          })) ?? [];
        const columns: TableColumnsType<(typeof rows)[number]> = [
          { title: '模块', dataIndex: 'module' },
          { title: '权限点', dataIndex: 'permissions', render: formatNumber },
          { title: '启用中的权限编码', dataIndex: 'touchedRoles', render: formatNumber },
        ];
        return {
          title: '权限管理',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="角色数" value={data.permissionsMatrix?.summary.roles ?? 0} /></Card>
              <Card className="metric-card"><Statistic title="模块数" value={data.permissionsMatrix?.summary.modules ?? 0} /></Card>
              <Card className="metric-card"><Statistic title="权限点" value={data.permissionsMatrix?.summary.permissions ?? 0} /></Card>
            </>
          ),
          rows,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
      case '/system/categories': {
        const columns: TableColumnsType<AdminCategoryItem> = [
          {
            title: '分类',
            render: (_, record) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{record.name}</Typography.Text>
                <Typography.Text type="secondary">{record.parentName || '一级分类'}</Typography.Text>
              </Space>
            ),
          },
          { title: '业务域', dataIndex: 'bizTypeLabel' },
          { title: '层级', dataIndex: 'level', render: formatNumber },
          { title: '排序', dataIndex: 'sort', render: formatNumber },
          { title: '引用量', dataIndex: 'usageCount', render: formatNumber },
          { title: '状态', render: (_, record) => statusTag(record.statusLabel, record.status === 'active' ? 'success' : 'default') },
        ];
        return {
          title: '分类管理',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="分类数" value={data.categories.length} /></Card>
              <Card className="metric-card"><Statistic title="启用中" value={data.categories.filter((item) => item.status === 'active').length} /></Card>
              <Card className="metric-card"><Statistic title="品牌分类" value={data.categories.filter((item) => item.bizType === 'brand').length} /></Card>
              <Card className="metric-card"><Statistic title="竞猜分类" value={data.categories.filter((item) => item.bizType === 'guess').length} /></Card>
            </>
          ),
          rows: data.categories,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
      default: {
        const columns: TableColumnsType<AdminNotificationItem> = [
          { title: '通知标题', dataIndex: 'title' },
          { title: '消息类型', dataIndex: 'type' },
          { title: '目标人群', dataIndex: 'audience' },
          { title: '接收人数', dataIndex: 'recipientCount', render: formatNumber },
          { title: '已读率', render: (_, record) => formatPercent(record.recipientCount === 0 ? 0 : record.readCount / record.recipientCount) },
          { title: '发送时间', dataIndex: 'sentAt', render: (value) => formatDateTime(value) },
        ];
        return {
          title: '通知管理',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="通知批次" value={data.notifications.length} /></Card>
              <Card className="metric-card"><Statistic title="接收人数" value={data.notifications.reduce((sum, item) => sum + item.recipientCount, 0)} /></Card>
              <Card className="metric-card"><Statistic title="未读人数" value={data.notifications.reduce((sum, item) => sum + item.unreadCount, 0)} /></Card>
            </>
          ),
          rows: data.notifications,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
    }
  }, [commentRows, danmakuRows, data.categories, data.chats, data.notifications, data.permissionsMatrix, data.roles, data.systemUsers, liveRows, path, postRows, reportRows]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = filters.keyword?.trim().toLowerCase();
    return view.rows.filter((row) => {
      const rowStatus =
        typeof row === 'object' && row && 'status' in row ? String(row.status) : 'all';
      if (status !== 'all' && rowStatus !== status) {
        return false;
      }
      switch (path) {
        case '/community/posts': {
          const record = row as StaticRow;
          if (normalizedKeyword && !String(record.title).toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && String(record.status) !== filters.second) {
            return false;
          }
          if (
            filters.third &&
            !String(record.author).toLowerCase().includes(filters.third.trim().toLowerCase())
          ) {
            return false;
          }
          return true;
        }
        case '/community/comments': {
          const record = row as StaticRow;
          if (normalizedKeyword && !String(record.content).toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && String(record.status) !== filters.second) {
            return false;
          }
          if (
            filters.third &&
            !String(record.author).toLowerCase().includes(filters.third.trim().toLowerCase())
          ) {
            return false;
          }
          return true;
        }
        case '/community/reports': {
          const record = row as StaticRow;
          if (normalizedKeyword && !String(record.reason).toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && String(record.status) !== filters.second) {
            return false;
          }
          if (
            filters.third &&
            !String(record.reporter).toLowerCase().includes(filters.third.trim().toLowerCase())
          ) {
            return false;
          }
          return true;
        }
        case '/live/list': {
          const record = row as StaticRow;
          if (normalizedKeyword && !String(record.room).toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && String(record.status) !== filters.second) {
            return false;
          }
          if (filters.third && String(record.host) !== filters.third) {
            return false;
          }
          return true;
        }
        case '/live/danmaku': {
          const record = row as StaticRow;
          if (normalizedKeyword && !String(record.content).toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && String(record.risk) !== filters.second) {
            return false;
          }
          if (filters.third && String(record.room) !== filters.third) {
            return false;
          }
          return true;
        }
        case '/system/chats': {
          const record = row as AdminChatItem;
          const pair = `${record.userA.name} ${record.userB.name}`.toLowerCase();
          if (normalizedKeyword && !pair.includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.riskLevel !== filters.second) {
            return false;
          }
          if (filters.third && record.status !== filters.third) {
            return false;
          }
          return true;
        }
        case '/system/users': {
          const record = row as AdminSystemUserItem;
          if (normalizedKeyword && !record.username.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.role !== filters.second) {
            return false;
          }
          if (filters.third && record.status !== filters.third) {
            return false;
          }
          return true;
        }
        case '/system/roles': {
          const record = row as AdminRoleListItem;
          if (normalizedKeyword && !record.name.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.scope !== filters.second) {
            return false;
          }
          if (filters.third && record.status !== filters.third) {
            return false;
          }
          return true;
        }
        case '/users/permissions': {
          const record = row as Record<string, unknown>;
          if (
            normalizedKeyword &&
            !String(record.module ?? '').toLowerCase().includes(normalizedKeyword)
          ) {
            return false;
          }
          return true;
        }
        case '/system/categories': {
          const record = row as AdminCategoryItem;
          if (normalizedKeyword && !record.name.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.bizTypeLabel !== filters.second) {
            return false;
          }
          if (filters.third && record.statusLabel !== filters.third) {
            return false;
          }
          return true;
        }
        default: {
          const record = row as AdminNotificationItem;
          if (normalizedKeyword && !record.title.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.type !== filters.second) {
            return false;
          }
          if (filters.third && record.audience !== filters.third) {
            return false;
          }
          return true;
        }
      }
    });
  }, [filters.keyword, filters.second, filters.third, path, status, view.rows]);

  const statusItems = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of view.rows) {
      const key =
        typeof row === 'object' && row && 'status' in row ? String(row.status) : 'all';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [
      { key: 'all', label: '全部', count: view.rows.length },
      ...Array.from(counts.entries())
        .filter(([key]) => key !== 'all')
        .map(([key, count]) => ({ key, label: key, count })),
    ];
  }, [view.rows]);

  const selectOptions = useMemo(() => {
    const rows = view.rows as Array<Record<string, unknown>>;
    const build = (key: string) =>
      Array.from(new Set(rows.map((item) => item[key]).filter(Boolean))).map((value) => ({
        label: String(value),
        value: String(value),
      }));

    switch (path) {
      case '/community/posts':
      case '/community/comments':
      case '/community/reports':
        return {
          second:
            path === '/community/posts'
              ? [
                  { label: '已发布', value: '已发布' },
                  { label: '待复核', value: '待复核' },
                ]
              : path === '/community/comments'
                ? [
                    { label: '正常', value: '正常' },
                    { label: '复核中', value: '复核中' },
                  ]
                : [
                    { label: '待处理', value: '待处理' },
                    { label: '处理中', value: '处理中' },
                  ],
          third: [],
          secondPlaceholder: '状态',
          thirdPlaceholder: '对象/用户',
        };
      case '/live/list':
        return {
          second: [
            { label: '直播中', value: '直播中' },
            { label: '已结束', value: '已结束' },
          ],
          third: build('host'),
          secondPlaceholder: '状态',
          thirdPlaceholder: '主播',
        };
      case '/live/danmaku':
        return {
          second: build('risk'),
          third: build('room'),
          secondPlaceholder: '风控状态',
          thirdPlaceholder: '直播间',
        };
      case '/system/chats':
        return {
          second: [
            { label: 'low', value: 'low' },
            { label: 'medium', value: 'medium' },
            { label: 'high', value: 'high' },
          ],
          third: [
            { label: 'normal', value: 'normal' },
            { label: 'review', value: 'review' },
            { label: 'escalated', value: 'escalated' },
          ],
          secondPlaceholder: '风险等级',
          thirdPlaceholder: '状态',
        };
      case '/system/users':
        return {
          second: build('role'),
          third: [
            { label: 'active', value: 'active' },
            { label: 'disabled', value: 'disabled' },
          ],
          secondPlaceholder: '角色',
          thirdPlaceholder: '状态',
        };
      case '/system/roles':
        return {
          second: build('scope'),
          third: [
            { label: 'active', value: 'active' },
            { label: 'disabled', value: 'disabled' },
          ],
          secondPlaceholder: '作用域',
          thirdPlaceholder: '状态',
        };
      case '/users/permissions':
        return {
          second: [],
          third: [],
          secondPlaceholder: '模块',
          thirdPlaceholder: '角色',
        };
      case '/system/categories':
        return {
          second: [
            { label: '品牌分类', value: '品牌分类' },
            { label: '店铺经营分类', value: '店铺经营分类' },
            { label: '商品分类', value: '商品分类' },
            { label: '竞猜分类', value: '竞猜分类' },
            { label: '未知业务', value: '未知业务' },
          ],
          third: [
            { label: '启用', value: '启用' },
            { label: '停用', value: '停用' },
          ],
          secondPlaceholder: '业务域',
          thirdPlaceholder: '状态',
        };
      default:
        return {
          second: build('type'),
          third: build('audience'),
          secondPlaceholder: '消息类型',
          thirdPlaceholder: '目标人群',
        };
    }
  }, [path, view.rows]);

  return (
    <div className="page-stack">
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      <AdminSearchPanel
        form={form}
        onSearch={() => {
          setFilters(form.getFieldsValue());
        }}
        onReset={() => {
          form.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="keyword">
          <Input
            placeholder={
              path === '/community/posts'
                ? '帖子标题'
                : path === '/community/comments'
                  ? '评论内容'
                  : path === '/community/reports'
                    ? '举报原因'
                    : path === '/live/list'
                      ? '直播间名称'
                      : path === '/live/danmaku'
                        ? '弹幕内容'
                        : path === '/system/chats'
                          ? '会话用户'
                          : path === '/system/users'
                            ? '系统用户名'
                            : path === '/system/roles'
                              ? '角色名称'
                              : path === '/users/permissions'
                                ? '模块名称'
                                : path === '/system/categories'
                                  ? '分类名称'
                                  : '通知标题'
            }
            allowClear
          />
        </Form.Item>
        <Form.Item name="second">
          {selectOptions.second.length > 0 ? (
            <Select
              placeholder={selectOptions.secondPlaceholder}
              allowClear
              options={selectOptions.second}
            />
          ) : (
            <Input placeholder={selectOptions.secondPlaceholder} allowClear />
          )}
        </Form.Item>
        <Form.Item name="third">
          {selectOptions.third.length > 0 ? (
            <Select
              placeholder={selectOptions.thirdPlaceholder}
              allowClear
              options={selectOptions.third}
            />
          ) : (
            <Input placeholder={selectOptions.thirdPlaceholder} allowClear />
          )}
        </Form.Item>
      </AdminSearchPanel>
      {statusItems.length > 2 ? (
        <AdminStatusTabs activeKey={status} items={statusItems} onChange={setStatus} />
      ) : null}
      <Card>
        <Table
          rowKey="id"
          columns={view.columns}
          dataSource={filteredRows}
          loading={loading}
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({ onClick: () => setSelected(record) })}
        />
      </Card>
      <Drawer
        open={selected != null}
        width={460}
        title={view.title}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Descriptions column={1} size="small">
            {Object.entries(selected).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>
                {typeof value === 'number'
                  ? value
                  : typeof value === 'string' && value.includes('T')
                    ? formatDateTime(value)
                    : String(value ?? '-')}
              </Descriptions.Item>
            ))}
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
