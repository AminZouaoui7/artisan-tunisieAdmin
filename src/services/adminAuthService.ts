import { adminApi } from "./adminApi";

type AdminLoginRequest = {
  email: string;
  password: string;
};

type AdminLoginResponse = {
  token: string;
  expiresAt: string;
  admin: {
    id: number;
    fullName: string;
    email: string;
  };
};

export async function loginAdmin(
  data: AdminLoginRequest
): Promise<AdminLoginResponse> {
  const response = await adminApi.post<AdminLoginResponse>(
    "/admin/auth/login",
    data
  );
  const result = response.data;

  localStorage.setItem("artisan_admin_token", result.token);
  localStorage.setItem("artisan_admin_user", JSON.stringify(result.admin));

  return result;
}

export function logoutAdmin() {
  localStorage.removeItem("artisan_admin_token");
  localStorage.removeItem("artisan_admin_user");
}
