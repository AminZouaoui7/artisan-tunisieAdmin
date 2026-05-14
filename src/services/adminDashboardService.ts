import type { AdminDashboardDto } from "../types/adminDashboardTypes";
import { adminApi } from "./adminApi";

export async function getAdminDashboard(): Promise<AdminDashboardDto> {
  const response = await adminApi.get<AdminDashboardDto>("/admin/dashboard");
  return response.data;
}
