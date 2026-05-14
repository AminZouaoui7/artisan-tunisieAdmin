import { adminApi } from "./adminApi";

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
  const response = await adminApi.get<AdminPriceRequestListItem[]>(
    "/admin/price-requests"
  );

  return response.data;
}

export async function getAdminPriceRequestById(id: string) {
  const response = await adminApi.get<AdminPriceRequestDetails>(
    `/admin/price-requests/${id}`
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
  const response = await adminApi.post<{
    message: string;
    id: string;
    status: PriceRequestStatus;
  }>(
    `/admin/price-requests/${id}/send-email`,
    {
      message: data.message,
      contactPhone: data.contactPhone,
    }
  );

  return response.data;
}

export async function updateAdminPriceRequestStatus(
  id: string,
  status: PriceRequestStatus
) {
  const response = await adminApi.put<{ message: string }>(
    `/admin/price-requests/${id}/status`,
    { status }
  );

  return response.data;
}
