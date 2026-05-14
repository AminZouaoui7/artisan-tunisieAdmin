import { adminApi } from "./adminApi";

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
  const response = await adminApi.get<AdminCustomerListItem[]>(
    "/admin/customers",
    {
      params: {
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(active !== null ? { active } : {}),
      },
    }
  );

  return response.data;
}

export async function getAdminCustomerById(id: number) {
  const response = await adminApi.get<AdminCustomerDetails>(
    `/admin/customers/${id}`
  );

  return response.data;
}

export async function toggleAdminCustomerActive(id: number) {
  const response = await adminApi.patch<{
    message: string;
    id: number;
    isActive: boolean;
  }>(`/admin/customers/${id}/toggle-active`);

  return response.data;
}
