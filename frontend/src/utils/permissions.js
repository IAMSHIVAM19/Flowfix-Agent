export function isAdmin(user) {
  return user?.role === "admin";
}

export function isOperations(user) {
  return (
    user?.role === "operations" ||
    user?.role === "admin"
  );
}