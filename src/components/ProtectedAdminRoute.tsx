import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { isAdminAuthenticated } from "../services/adminAuthService";

export default function ProtectedAdminRoute({
  children,
}: {
  children: ReactNode;
}) {
  const location = useLocation();

  if (!isAdminAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
