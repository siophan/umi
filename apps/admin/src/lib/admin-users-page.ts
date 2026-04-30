import type { AdminInviteRecordItem, GuessSummary, OrderSummary, UserSummary } from '@umi/shared';

import { useEffect, useMemo, useState } from 'react';

import {
  fetchAdminUserDetail,
  fetchAdminUserGuesses,
  fetchAdminUserInvites,
  fetchAdminUserOrders,
  updateAdminUserBan,
} from './api/users';

interface UseAdminUserDetailStateOptions {
  onUserBanUpdated?: () => Promise<void>;
  onBanSuccess?: (banned: boolean) => void;
  onBanError?: (error: unknown) => void;
}

export interface AdminUserDetailState {
  selectedId: string | null;
  detailTab: string;
  detailLoading: boolean;
  detailSubmitting: boolean;
  selected: UserSummary | null;
  detailIssue: string;
  orderIssue: string | null;
  guessIssue: string | null;
  inviteIssue: string | null;
  ordersLoading: boolean;
  guessesLoading: boolean;
  invitesLoading: boolean;
  userOrders: OrderSummary[];
  userGuesses: GuessSummary[];
  userInvites: AdminInviteRecordItem[];
  orderPage: number;
  orderPageSize: number;
  orderTotal: number;
  guessPage: number;
  guessPageSize: number;
  guessTotal: number;
  invitePage: number;
  invitePageSize: number;
  inviteTotal: number;
  setSelectedId: (userId: string | null) => void;
  setDetailTab: (tab: string) => void;
  handleToggleBan: () => Promise<void>;
  handleOrderPageChange: (page: number, pageSize: number) => void;
  handleGuessPageChange: (page: number, pageSize: number) => void;
  handleInvitePageChange: (page: number, pageSize: number) => void;
}

function handleTablePageChange(
  currentPageSize: number,
  setPage: (page: number) => void,
  setPageSize: (pageSize: number) => void,
  nextPage: number,
  nextPageSize: number,
) {
  if (nextPageSize !== currentPageSize) {
    setPage(1);
    setPageSize(nextPageSize);
    return;
  }

  setPage(nextPage);
}

export function useAdminUserDetailState({
  onUserBanUpdated,
  onBanSuccess,
  onBanError,
}: UseAdminUserDetailStateOptions = {}): AdminUserDetailState {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState('info');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSubmitting, setDetailSubmitting] = useState(false);
  const [selected, setSelected] = useState<UserSummary | null>(null);
  const [profileIssue, setProfileIssue] = useState<string | null>(null);
  const [orderIssue, setOrderIssue] = useState<string | null>(null);
  const [guessIssue, setGuessIssue] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [guessesLoading, setGuessesLoading] = useState(false);
  const [userOrders, setUserOrders] = useState<OrderSummary[]>([]);
  const [userGuesses, setUserGuesses] = useState<GuessSummary[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(10);
  const [orderTotal, setOrderTotal] = useState(0);
  const [guessPage, setGuessPage] = useState(1);
  const [guessPageSize, setGuessPageSize] = useState(10);
  const [guessTotal, setGuessTotal] = useState(0);
  const [inviteIssue, setInviteIssue] = useState<string | null>(null);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [userInvites, setUserInvites] = useState<AdminInviteRecordItem[]>([]);
  const [invitePage, setInvitePage] = useState(1);
  const [invitePageSize, setInvitePageSize] = useState(10);
  const [inviteTotal, setInviteTotal] = useState(0);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      setUserOrders([]);
      setUserGuesses([]);
      setUserInvites([]);
      setProfileIssue(null);
      setOrderIssue(null);
      setGuessIssue(null);
      setInviteIssue(null);
      setDetailTab('info');
      setOrderPage(1);
      setOrderPageSize(10);
      setOrderTotal(0);
      setGuessPage(1);
      setGuessPageSize(10);
      setGuessTotal(0);
      setInvitePage(1);
      setInvitePageSize(10);
      setInviteTotal(0);
      return;
    }

    const currentSelectedId = selectedId;
    let alive = true;

    setSelected(null);
    setUserOrders([]);
    setUserGuesses([]);
    setUserInvites([]);
    setProfileIssue(null);
    setOrderIssue(null);
    setGuessIssue(null);
    setInviteIssue(null);
    setDetailTab('info');
    setOrderTotal(0);
    setGuessTotal(0);
    setInviteTotal(0);

    async function loadUserDetail() {
      setDetailLoading(true);
      setProfileIssue(null);
      try {
        const userResult = await fetchAdminUserDetail(currentSelectedId);

        if (!alive) {
          return;
        }

        setSelected(userResult);
        setOrderTotal(userResult.totalOrders ?? 0);
        setGuessTotal(userResult.totalGuess ?? 0);
      } catch (error) {
        if (!alive) {
          return;
        }

        setSelected(null);
        setProfileIssue(error instanceof Error ? error.message : '用户详情加载失败');
      } finally {
        if (alive) {
          setDetailLoading(false);
        }
      }
    }

    void loadUserDetail();

    return () => {
      alive = false;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const currentSelectedId = selectedId;
    let alive = true;

    async function loadOrders() {
      setOrdersLoading(true);
      setOrderIssue(null);
      try {
        const result = await fetchAdminUserOrders(currentSelectedId, {
          page: orderPage,
          pageSize: orderPageSize,
        });

        if (!alive) {
          return;
        }

        setUserOrders(result.items);
        setOrderTotal(result.total);
      } catch (error) {
        if (!alive) {
          return;
        }

        setUserOrders([]);
        setOrderIssue(error instanceof Error ? `订单记录：${error.message}` : '订单记录加载失败');
      } finally {
        if (alive) {
          setOrdersLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      alive = false;
    };
  }, [orderPage, orderPageSize, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const currentSelectedId = selectedId;
    let alive = true;

    async function loadGuesses() {
      setGuessesLoading(true);
      setGuessIssue(null);
      try {
        const result = await fetchAdminUserGuesses(currentSelectedId, {
          page: guessPage,
          pageSize: guessPageSize,
        });

        if (!alive) {
          return;
        }

        setUserGuesses(result.items);
        setGuessTotal(result.total);
      } catch (error) {
        if (!alive) {
          return;
        }

        setUserGuesses([]);
        setGuessIssue(error instanceof Error ? `竞猜记录：${error.message}` : '竞猜记录加载失败');
      } finally {
        if (alive) {
          setGuessesLoading(false);
        }
      }
    }

    void loadGuesses();

    return () => {
      alive = false;
    };
  }, [guessPage, guessPageSize, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const currentSelectedId = selectedId;
    let alive = true;

    async function loadInvites() {
      setInvitesLoading(true);
      setInviteIssue(null);
      try {
        const result = await fetchAdminUserInvites(currentSelectedId, {
          page: invitePage,
          pageSize: invitePageSize,
        });

        if (!alive) {
          return;
        }

        setUserInvites(result.items);
        setInviteTotal(result.total);
      } catch (error) {
        if (!alive) {
          return;
        }

        setUserInvites([]);
        setInviteIssue(error instanceof Error ? `邀请记录：${error.message}` : '邀请记录加载失败');
      } finally {
        if (alive) {
          setInvitesLoading(false);
        }
      }
    }

    void loadInvites();

    return () => {
      alive = false;
    };
  }, [invitePage, invitePageSize, selectedId]);

  const detailIssue = useMemo(
    () => [profileIssue, orderIssue, guessIssue].filter(Boolean).join('；'),
    [guessIssue, orderIssue, profileIssue],
  );

  async function handleToggleBan() {
    if (!selected) {
      return;
    }

    setDetailSubmitting(true);
    try {
      const result = await updateAdminUserBan(selected.id, {
        banned: !selected.banned,
      });

      setSelected((current) => (current ? { ...current, banned: result.banned } : current));
      onBanSuccess?.(result.banned);
      await onUserBanUpdated?.();
    } catch (error) {
      onBanError?.(error);
    } finally {
      setDetailSubmitting(false);
    }
  }

  return {
    selectedId,
    detailTab,
    detailLoading,
    detailSubmitting,
    selected,
    detailIssue,
    orderIssue,
    guessIssue,
    inviteIssue,
    ordersLoading,
    guessesLoading,
    invitesLoading,
    userOrders,
    userGuesses,
    userInvites,
    orderPage,
    orderPageSize,
    orderTotal,
    guessPage,
    guessPageSize,
    guessTotal,
    invitePage,
    invitePageSize,
    inviteTotal,
    setSelectedId,
    setDetailTab,
    handleToggleBan,
    handleOrderPageChange: (nextPage, nextPageSize) =>
      handleTablePageChange(orderPageSize, setOrderPage, setOrderPageSize, nextPage, nextPageSize),
    handleGuessPageChange: (nextPage, nextPageSize) =>
      handleTablePageChange(guessPageSize, setGuessPage, setGuessPageSize, nextPage, nextPageSize),
    handleInvitePageChange: (nextPage, nextPageSize) =>
      handleTablePageChange(invitePageSize, setInvitePage, setInvitePageSize, nextPage, nextPageSize),
  };
}
