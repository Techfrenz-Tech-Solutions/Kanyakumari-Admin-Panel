export function hasPermission(user, permission) {
  if (!user || !permission) return false;
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  return permissions.includes('*') || permissions.includes(permission);
}

export function hasAnyPermission(user, requested = []) {
  return requested.some((permission) => hasPermission(user, permission));
}

export function hasRole(user, role) {
  if (!user) return false;
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
}

export function filterNavigation(sections, user) {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || hasPermission(user, item.permission)),
    }))
    .filter((section) => section.items.length > 0);
}
