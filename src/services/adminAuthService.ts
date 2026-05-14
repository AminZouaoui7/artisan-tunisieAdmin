// src/services/adminAuthService.ts

const API_URL = "http://localhost:5163/api/admin/auth/login";

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
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Login admin failed");
  }

  const result: AdminLoginResponse = await response.json();

  localStorage.setItem("artisan_admin_token", result.token);
  localStorage.setItem("artisan_admin_user", JSON.stringify(result.admin));

  return result;
}

export function logoutAdmin() {
  localStorage.removeItem("artisan_admin_token");
  localStorage.removeItem("artisan_admin_user");
}