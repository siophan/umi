import type { ReactNode } from 'react';
import type { MenuProps } from 'antd';
import {
  ADMIN_PERMISSION_DEFINITION_BY_CODE,
  findAdminMenuPermissionByPath,
  type AdminProfile,
} from '@umi/shared';

import { adminMenuTree, type AdminMenuNode } from './admin-menu-config';
import {
  ADMIN_HIDDEN_PAGE_META,
  type AdminPageMeta,
  DASHBOARD_PATH,
  findAdminDetailRoute,
  normalizeAdminPath,
  resolveAdminAccessPath,
  resolveAdminSelectedPath,
} from './admin-route-meta';

export {
  DASHBOARD_PATH,
  normalizeAdminPath,
  resolveAdminSelectedPath,
} from './admin-route-meta';

function flattenMenu(items: AdminMenuNode[], parentName?: string): AdminPageMeta[] {
  return items.flatMap((item) => {
    if (item.children?.length) {
      return flattenMenu(item.children, item.name);
    }

    return item.path ? [{ path: item.path, name: item.name, parentName }] : [];
  });
}

const adminPageMeta = [
  ...flattenMenu(adminMenuTree),
  ...ADMIN_HIDDEN_PAGE_META.map((item) => ({
    path: item.path,
    name: item.name,
    parentName: item.parentName,
  })),
];

export function findAdminPageMeta(path: string) {
  const detailRoute = findAdminDetailRoute(path);
  if (detailRoute) {
    return { path, name: detailRoute.name, parentName: detailRoute.parentName };
  }

  return adminPageMeta.find((item) => item.path === path) ?? adminPageMeta[0];
}

export function getAdminMenuTree() {
  return adminMenuTree;
}

export function toAdminMenuItems(
  nodes: AdminMenuNode[],
): NonNullable<MenuProps['items']> {
  return nodes.map((node) => {
    if (node.children?.length) {
      return {
        key: node.key,
        icon: node.icon,
        label: node.name,
        children: toAdminMenuItems(node.children),
      };
    }

    const path = node.path ?? node.key;
    return {
      key: path,
      icon: node.icon,
      label: node.name,
    };
  });
}

export function findAdminMenuOpenKeys(
  nodes: AdminMenuNode[],
  targetPath: string,
  parentKeys: string[] = [],
): string[] {
  const resolvedTargetPath = resolveAdminSelectedPath(targetPath);

  for (const node of nodes) {
    if (node.path === resolvedTargetPath) {
      return parentKeys;
    }

    if (node.children?.length) {
      const nextKeys = findAdminMenuOpenKeys(node.children, targetPath, [
        ...parentKeys,
        node.key,
      ]);
      if (nextKeys.length > 0) {
        return nextKeys;
      }
    }
  }

  return [];
}

export function sameAdminKeys(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((key, index) => key === right[index]);
}

function hasNodeAccess(node: AdminMenuNode, currentUser: AdminProfile) {
  const permissions = currentUser.permissions ?? [];
  const access = node.access;

  if (!access) {
    return true;
  }

  return (
    access.permissionCodes?.some((code) => {
      if (permissions.includes(code)) {
        return true;
      }

      const definition = ADMIN_PERMISSION_DEFINITION_BY_CODE[code];
      return Boolean(definition?.parentCode && permissions.includes(definition.parentCode));
    }) ?? false
  );
}

export function filterAdminMenuTreeByAccess(
  items: AdminMenuNode[],
  currentUser: AdminProfile,
): AdminMenuNode[] {
  return items
    .map((item) => {
      if (item.children?.length) {
        const children = filterAdminMenuTreeByAccess(item.children, currentUser);
        return children.length > 0 ? { ...item, children } : null;
      }

      return hasNodeAccess(item, currentUser) ? item : null;
    })
    .filter(Boolean) as AdminMenuNode[];
}

export function findFirstAccessibleAdminPath(items: AdminMenuNode[]): string | null {
  for (const item of items) {
    if (item.children?.length) {
      const childPath = findFirstAccessibleAdminPath(item.children);
      if (childPath) {
        return childPath;
      }
      continue;
    }

    if (item.path) {
      return item.path;
    }
  }

  return null;
}

export function isAdminPathAccessible(
  path: string,
  currentUser: AdminProfile,
): boolean {
  const resolvedPath = resolveAdminAccessPath(path);
  const permissions = currentUser.permissions ?? [];
  const definition = findAdminMenuPermissionByPath(resolvedPath);

  if (definition) {
    return (
      permissions.includes(definition.code) ||
      Boolean(definition.parentCode && permissions.includes(definition.parentCode))
    );
  }

  const traverse = (items: AdminMenuNode[]): boolean => {
    for (const item of items) {
      if (item.children?.length) {
        if (traverse(item.children)) {
          return true;
        }
        continue;
      }

      if (item.path === resolvedPath) {
        return hasNodeAccess(item, currentUser);
      }
    }

    return false;
  };

  return traverse(adminMenuTree);
}
