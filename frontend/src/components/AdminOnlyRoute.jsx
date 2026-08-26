import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  getCurrentAdmin,
  isAuthenticated,
} from "../services/api";

function AdminOnlyRoute() {
  const [checking, setChecking] =
    useState(true);

  const [allowed, setAllowed] =
    useState(false);

  useEffect(() => {
    async function checkRole() {
      if (!isAuthenticated()) {
        setAllowed(false);
        setChecking(false);
        return;
      }

      try {
        const admin =
          await getCurrentAdmin();

        setAllowed(
          admin.role === "admin"
        );
      } catch {
        setAllowed(false);
      } finally {
        setChecking(false);
      }
    }

    checkRole();
  }, []);

  if (checking) {
    return null;
  }

  if (!allowed) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Outlet />;
}

export default AdminOnlyRoute;