export function normalizeRole(role) {
  if (!role || typeof role !== "string") {
    return "user";
  }

  const normalizedRole = role.toLowerCase();

  if (normalizedRole === "trainer" || normalizedRole === "admin") {
    return normalizedRole;
  }

  return "user";
}

export function getDashboardPathForRole(role) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "trainer") {
    return "/trainer/dashboard";
  }

  if (normalizedRole === "admin") {
    return "/admin/dashboard";
  }

  return "/user/dashboard";
}

export function getRoleLabel(role) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "trainer") {
    return "Trainer";
  }

  if (normalizedRole === "admin") {
    return "Admin";
  }

  return "User";
}
