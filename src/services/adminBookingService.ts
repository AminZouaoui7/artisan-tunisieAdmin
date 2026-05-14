import { adminApi } from "./adminApi";

export type BookingStatus =
  | "Pending"
  | "Accepted"
  | "Refused"
  | "Cancelled"
  | "Completed";

export type BookingProduct = {
  productId: number;
  productName: string;
  mainImageUrl?: string | null;
  price?: number | null;
  category?: string | null;
  type?: string | null;
  region?: string | null;
  status: string;
};

export type AdminBooking = {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  demoDate: string;
  demoTime: string;
  guestsCount: number;
  durationMinutes: number;
  message?: string | null;
  status: BookingStatus;
  letTeamChooseProducts: boolean;
  createdAt: string;
  updatedAt?: string | null;
  productsToSee: BookingProduct[];
};

export type BookingActionResponse = {
  message: string;
  id: number;
  status: BookingStatus;
  emailSent: boolean;
};

export async function getAdminBookings(status?: string) {
  const response = await adminApi.get<AdminBooking[]>("/admin/demo-bookings", {
    params: status && status !== "All" ? { status } : undefined,
  });

  return response.data;
}

export async function getAdminBookingById(id: number) {
  const response = await adminApi.get<AdminBooking>(
    `/admin/demo-bookings/${id}`
  );

  return response.data;
}

export async function acceptAdminBooking(id: number) {
  const response = await adminApi.patch<BookingActionResponse>(
    `/admin/demo-bookings/${id}/accept`
  );

  return response.data;
}

export async function refuseAdminBooking(id: number) {
  const response = await adminApi.patch<BookingActionResponse>(
    `/admin/demo-bookings/${id}/refuse`
  );

  return response.data;
}

export async function updateAdminBookingStatus(
  id: number,
  status: BookingStatus
) {
  const response = await adminApi.patch<BookingActionResponse>(
    `/admin/demo-bookings/${id}/status`,
    { status }
  );

  return response.data;
}
