import type { AdminDashboardDto } from "../types/adminDashboardTypes";

const API_URL = "http://localhost:5163/api/admin/dashboard";

export async function getAdminDashboard(): Promise<AdminDashboardDto> {
  const token = localStorage.getItem("artisan_admin_token");

  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Impossible de charger le dashboard admin.");
  }

  return response.json();
}