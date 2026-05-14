// ===== PRODUCT =====
export interface Product {
  id: number
  name: string
  slug: string
  description?: string
  category?: string
  price: number
  stock: number
  isActive: boolean
  isFeatured: boolean
  mainImageUrl?: string
  createdAt: string
  images: ProductImage[]
}

export interface ProductImage {
  id: number
  productId: number
  imageUrl: string
  sortOrder: number
  isMain: boolean
}

// ===== ORDER =====
export interface Order {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  totalAmount: number
  currency: string
  status: string
  paymentStatus: string
  shippingStatus: string
  createdAt: string
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  productId: number
  productName: string
  unitPrice: number
  quantity: number
  totalPrice: number
}

// ===== BOOKING =====
export interface Booking {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  bookingDate: string
  status: string
  createdAt: string
}

// ===== PRICE REQUEST =====
export interface PriceRequest {
  id: string
  productId: number
  productName: string
  customerName: string
  email: string
  phone: string
  status: string
  createdAt: string
  messagesCount: number
}