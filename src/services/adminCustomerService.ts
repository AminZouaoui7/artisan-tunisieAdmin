import axios from "axios";

const API_URL = "http://localhost:5163/api/admin/customers";

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

export type AdminCustomerListItem = {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

export type AdminCustomerOrder = {
  id: number;
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

export type AdminCustomerPriceRequest = {
  id: number;
  productName: string;
  status: string;
  createdAt: string;
};

export type AdminCustomerDemoBooking = {
  id: number;
  demoDate: string;
  demoTime: string;
  status: string;
  createdAt: string;
};

export type AdminCustomerDetails = AdminCustomerListItem & {
  orders: AdminCustomerOrder[];
  priceRequests: AdminCustomerPriceRequest[];
  demoBookings: AdminCustomerDemoBooking[];
};

export async function getAdminCustomers(
  search = "",
  active: boolean | null = null
) {
  const params = new URLSearchParams();

  if (search.trim()) params.append("search", search.trim());
  if (active !== null) params.append("active", String(active));

  const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;

  const response = await axios.get<AdminCustomerListItem[]>(url, authHeaders());
  return response.data;
}

export async function getAdminCustomerById(id: number) {
  const response = await axios.get<AdminCustomerDetails>(
    `${API_URL}/${id}`,
    authHeaders()
  );

  return response.data;
}

export async function toggleAdminCustomerActive(id: number) {
  const response = await axios.patch<{
    message: string;
    id: number;
    isActive: boolean;
  }>(`${API_URL}/${id}/toggle-active`, {}, authHeaders());

  return response.data;
}