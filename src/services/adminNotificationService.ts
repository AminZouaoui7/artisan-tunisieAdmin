import { adminApi } from "./adminApi";

export type AdminNotificationSummary = {
  pendingOrders: number;
  pendingBookings: number;
  pendingPriceRequests: number;
  total: number;
};

export async function getAdminNotificationSummary() {
  const response = await adminApi.get<AdminNotificationSummary>(
    "/admin/notifications/summary"
  );

  return response.data;
}