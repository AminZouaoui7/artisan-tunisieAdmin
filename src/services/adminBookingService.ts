import axios from "axios";

const API_URL = "http://localhost:5163/api/admin/demo-bookings";

function getAdminToken() {
  return (
    localStorage.getItem("artisan_admin_token") ||
    localStorage.getItem("artisan_admin_access_token")
  );
}

function authHeaders() {
  const token = getAdminToken();

  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
}

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
  const url =
    status && status !== "All"
      ? `${API_URL}?status=${encodeURIComponent(status)}`
      : API_URL;

  const response = await axios.get<AdminBooking[]>(url, authHeaders());
  return response.data;
}

export async function getAdminBookingById(id: number) {
  const response = await axios.get<AdminBooking>(
    `${API_URL}/${id}`,
    authHeaders()
  );

  return response.data;
}

export async function acceptAdminBooking(id: number) {
  const response = await axios.patch<BookingActionResponse>(
    `${API_URL}/${id}/accept`,
    {},
    authHeaders()
  );

  console.log("ACCEPT BOOKING RESPONSE:", response.data);

  return response.data;
}

export async function refuseAdminBooking(id: number) {
  const response = await axios.patch<BookingActionResponse>(
    `${API_URL}/${id}/refuse`,
    {},
    authHeaders()
  );

  console.log("REFUSE BOOKING RESPONSE:", response.data);

  return response.data;
}

export async function updateAdminBookingStatus(
  id: number,
  status: BookingStatus
) {
  const response = await axios.patch<BookingActionResponse>(
    `${API_URL}/${id}/status`,
    { status },
    authHeaders()
  );

  console.log("UPDATE BOOKING STATUS RESPONSE:", response.data);

  return response.data;
}