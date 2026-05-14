import axios from "axios";

const API_URL = "http://localhost:5163/api/admin/price-requests";

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
      "Content-Type": "application/json",
    },
  };
}

export type PriceRequestStatus = "Pending" | "Answered" | "Closed" | string;

export type AdminPriceRequestListItem = {
  id: string;
  productId: number;
  productName: string;
  customerName: string;
  email: string;
  phone?: string | null;
  countryCode?: string | null;
  status: PriceRequestStatus;
  createdAt: string;
  updatedAt?: string | null;
  messagesCount: number;
};

export type AdminPriceRequestMessage = {
  id: number;
  senderType: string;
  message: string;
  sentAt: string;
};

export type AdminPriceRequestDetails = {
  id: string;
  productId: number;
  productName: string;
  customerName: string;
  email: string;
  phone?: string | null;
  countryCode?: string | null;
  status: PriceRequestStatus;
  createdAt: string;
  updatedAt?: string | null;
  messages: AdminPriceRequestMessage[];
};

export async function getAdminPriceRequests() {
  const response = await axios.get<AdminPriceRequestListItem[]>(
    API_URL,
    authHeaders()
  );

  return response.data;
}

export async function getAdminPriceRequestById(id: string) {
  const response = await axios.get<AdminPriceRequestDetails>(
    `${API_URL}/${id}`,
    authHeaders()
  );

  return response.data;
}

export async function sendAdminPriceRequestEmail(
  id: string,
  data: {
    message: string;
    contactPhone: string;
  }
) {
  const response = await axios.post<{
    message: string;
    id: string;
    status: PriceRequestStatus;
  }>(
    `${API_URL}/${id}/send-email`,
    {
      message: data.message,
      contactPhone: data.contactPhone,
    },
    authHeaders()
  );

  return response.data;
}

export async function updateAdminPriceRequestStatus(
  id: string,
  status: PriceRequestStatus
) {
  const response = await axios.put<{ message: string }>(
    `${API_URL}/${id}/status`,
    { status },
    authHeaders()
  );

  return response.data;
}