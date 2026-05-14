import { adminApi } from "./adminApi";

type AdminLoginRequest = {
  email: string;
  password: string;
};

type AdminLoginResponse = {
  token: string;
  expiresAt?: string;
  admin?: {
    id: number;
    fullName: string;
    email: string;
  } | null;
};

type AdminLoginApiResponse =
  | AdminLoginResponse
  | {
      data: AdminLoginResponse;
    };

function normalizeAdminLoginResponse(
  payload: AdminLoginApiResponse
): AdminLoginResponse {
  const result = "data" in payload ? payload.data : payload;

  if (!result?.token) {
    throw new Error("Token admin introuvable dans la reponse.");
  }

  return result;
}

export function getStoredAdminToken() {
  return localStorage.getItem("artisan_admin_token") || "";
}

export function isAdminAuthenticated() {
  return Boolean(getStoredAdminToken());
}

export async function loginAdmin(
  data: AdminLoginRequest
): Promise<AdminLoginResponse> {
  const response = await adminApi.post<AdminLoginApiResponse>(
    "/admin/auth/login",
    data
  );
  const result = normalizeAdminLoginResponse(response.data);

  localStorage.setItem("artisan_admin_token", result.token);
  if (result.admin) {
    localStorage.setItem("artisan_admin_user", JSON.stringify(result.admin));
  } else {
    localStorage.removeItem("artisan_admin_user");
  }

  return result;
}

export function logoutAdmin() {
  localStorage.removeItem("artisan_admin_token");
  localStorage.removeItem("artisan_admin_user");
}
