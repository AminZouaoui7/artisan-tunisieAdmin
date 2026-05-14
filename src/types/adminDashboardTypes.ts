export type DashboardStatsDto = {
  totalProducts: number;
  activeProducts: number;
  featuredProducts: number;
  reservedProducts: number;
  soldOutProducts: number;

  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  shippedOrders: number;

  paidRevenue: number;
  totalCustomers: number;

  pendingPriceRequests: number;
  pendingDemoBookings: number;
};

export type RecentOrderDto = {
  id: number;
  customerName: string;
  email: string;
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

export type RecentPriceRequestDto = {
  id: number;
  customerName: string;
  productName: string;
  status: string;
  createdAt: string;
};

export type RecentDemoBookingDto = {
  id: number;
  fullName: string;
  demoDate: string;
  demoTime: string;
  status: string;
  createdAt: string;
};

export type AdminAlertDto = {
  type: string;
  message: string;
  count: number;
};

export type AdminDashboardDto = {
  stats: DashboardStatsDto;
  recentOrders: RecentOrderDto[];
  recentPriceRequests: RecentPriceRequestDto[];
  recentDemoBookings: RecentDemoBookingDto[];
  alerts: AdminAlertDto[];
};