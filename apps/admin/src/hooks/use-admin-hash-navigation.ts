import type { AdminProfile } from '@umi/shared';
import { useEffect, useMemo, useState } from 'react';

import {
  DASHBOARD_PATH,
  findAdminMenuOpenKeys,
  filterAdminMenuTreeByAccess,
  findFirstAccessibleAdminPath,
  findAdminPageMeta,
  getAdminMenuTree,
  isAdminPathAccessible,
  normalizeAdminPath,
  sameAdminKeys,
  toAdminMenuItems,
} from '../lib/admin-navigation';

const MENU_TREE = getAdminMenuTree();

export function useAdminHashNavigation(currentUser: AdminProfile | null) {
  const [activePath, setActivePath] = useState(() =>
    normalizeAdminPath(window.location.hash),
  );
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpenKeys, setMenuOpenKeys] = useState<string[]>(() =>
    findAdminMenuOpenKeys(MENU_TREE, normalizeAdminPath(window.location.hash)),
  );

  const accessibleMenuTree = useMemo(
    () => (currentUser ? filterAdminMenuTreeByAccess(MENU_TREE, currentUser) : []),
    [currentUser],
  );
  const firstAccessiblePath = useMemo(
    () => findFirstAccessibleAdminPath(accessibleMenuTree),
    [accessibleMenuTree],
  );
  const activePathAccessible = useMemo(
    () => (currentUser ? isAdminPathAccessible(activePath, currentUser) : false),
    [activePath, currentUser],
  );
  const visiblePath = activePathAccessible
    ? activePath
    : firstAccessiblePath ?? activePath;
  const activeMenuParentKeys = useMemo(
    () => findAdminMenuOpenKeys(accessibleMenuTree, visiblePath),
    [accessibleMenuTree, visiblePath],
  );
  const activeMeta = findAdminPageMeta(visiblePath);
  const menuItems = useMemo(() => toAdminMenuItems(accessibleMenuTree), [accessibleMenuTree]);
  const breadcrumbItems = [
    ...(activeMeta.parentName ? [{ title: activeMeta.parentName }] : []),
    { title: activeMeta.name },
  ];

  useEffect(() => {
    const syncFromHash = () => {
      setActivePath(normalizeAdminPath(window.location.hash));
    };

    if (!window.location.hash) {
      window.location.hash = DASHBOARD_PATH;
    }

    window.addEventListener('hashchange', syncFromHash);

    return () => {
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, []);

  useEffect(() => {
    setMenuOpenKeys((currentKeys) =>
      sameAdminKeys(currentKeys, activeMenuParentKeys)
        ? currentKeys
        : activeMenuParentKeys,
    );
  }, [activeMenuParentKeys]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (firstAccessiblePath && activePath !== visiblePath) {
      window.location.hash = visiblePath;
    }
  }, [activePath, currentUser, firstAccessiblePath, visiblePath]);

  return {
    activePath,
    activePathAccessible,
    breadcrumbItems,
    collapsed,
    firstAccessiblePath,
    menuItems,
    menuOpenKeys,
    setCollapsed,
    setMenuOpenKeys,
    visiblePath,
  };
}
