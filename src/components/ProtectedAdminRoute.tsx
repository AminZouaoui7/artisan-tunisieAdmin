import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

export default function ProtectedAdminRoute({
  children,
}: {
  children: ReactNode;
}) {
  const location = useLocation();

  const token =
    localStorage.getItem("artisan_admin_token") ||
    localStorage.getItem("artisan_admin_access_token");

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
} 