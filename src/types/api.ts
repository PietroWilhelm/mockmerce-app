export type ProductType = 'SIMPLE' | 'VARIABLE';
export type ProductState = 'DRAFT' | 'PUBLISHED' | 'HIDDEN';

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  state: ProductState;
  brand: string | null;
  categoryId: string | null;
  priceFrom: number;
  priceTo: number;
  stock: number;
  image: string | null;
  variantsCount: number;
}

export interface ProductImage {
  id: string;
  url: string;
  position: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  barcode: string | null;
  price: number;
  stock: number;
  minStock: number;
  isDefault: boolean;
  active: boolean;
  label: string | null;
  options: { option: string; value: string }[];
  images: ProductImage[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  state: ProductState;
  description: string | null;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  tags: string[];
  options: { id: string; name: string; values: { id: string; value: string }[] }[];
  variants: ProductVariant[];
  images: ProductImage[];
  createdAt: string;
}

export interface CartItem {
  variantId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  customer: Customer;
}

export interface OrderItem {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderPayment {
  status: string;
  method: string;
  amount: number;
  transactionId: string;
}

export interface Order {
  id: string;
  status: string;
  total: number;
  items: OrderItem[];
  payment: OrderPayment | null;
  createdAt: string;
}

// A API não documenta um schema fixo para a timeline; tratamos como registro livre.
export type OrderTimelineEvent = Record<string, unknown>;

export interface StoreSettings {
  storeName?: string | null;
  primaryColor?: string | null;
  logoUrl?: string | null;
}

export interface FavoriteItem {
  variantId: string;
  product: string;
  sku: string;
  price: number;
}

export interface ShippingQuoteOption {
  method: string;
  price: number;
  deadlineDays: number;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
