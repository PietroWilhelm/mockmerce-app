export type ProductType = 'SIMPLE' | 'VARIABLE';
export type ProductState = 'DRAFT' | 'PUBLISHED' | 'HIDDEN';

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Média e contagem de avaliações VISÍVEIS. Vem junto do produto (RF-35). */
export interface ProductRating {
  average: number;
  count: number;
}

export type RatingDistribution = Record<'1' | '2' | '3' | '4' | '5', number>;

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
  rating: ProductRating;
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
  /** No detalhe vem também a distribuição por estrela. */
  rating: ProductRating & { distribution: RatingDistribution };
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
  /** Preenchido quando o pedido é retirada; null quando é entrega (RF-47). */
  pickup: OrderPickup | null;
  createdAt: string;
}

export interface OrderPickup {
  id: string;
  name: string;
  hours: string | null;
  coordinate: Coordinate;
  address: Partial<PickupAddress>;
}

// A API não documenta um schema fixo para a timeline; tratamos como registro livre.
export type OrderTimelineEvent = Record<string, unknown>;

export interface StoreSettings {
  storeName?: string | null;
  primaryColor?: string | null;
  logoUrl?: string | null;
  /** Localização da loja, cadastrada no painel (Loja → localização). */
  latitude?: number | null;
  longitude?: number | null;
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

// ---- Avaliações (CP5) -------------------------------------------------------

export interface ReviewImage {
  id: string;
  url: string;
  mediaId: string | null;
}

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  images: ReviewImage[];
  /** A API devolve só "Maria S.", nunca o nome completo. */
  author: { name: string; id: string | null };
  verifiedPurchase: boolean;
  /** Ocultada pela loja no painel. Só volta assim na lista do próprio autor. */
  hidden: boolean;
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsResponse extends Paginated<Review> {
  summary: ProductRating & { distribution: RatingDistribution };
}

export type CanReviewReason = 'ALREADY_REVIEWED' | 'NOT_PURCHASED';

export interface CanReview {
  canReview: boolean;
  /** O motivo vem do servidor; `string` cobre um motivo novo que o app não conhece. */
  reason: CanReviewReason | (string & {}) | null;
  message: string;
  reviewId: string | null;
}

export interface NewReview {
  rating: number;
  title?: string | null;
  comment?: string;
  /** Ids devolvidos por POST /uploads. A avaliação referencia o id, não a URL. */
  mediaIds?: string[];
}

export interface UploadedMedia {
  id: string;
  kind: 'IMAGE' | 'VIDEO';
  url: string;
  mimeType: string;
  sizeBytes: number;
}

// ---- Localização e retirada (CP5) ------------------------------------------

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface PickupAddress {
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
}

export interface PickupPoint {
  id: string;
  name: string;
  address: PickupAddress;
  coordinate: Coordinate;
  hours: string | null;
  active: boolean;
  /** null quando o app não mandou a posição (GPS negado ou sem leitura). */
  distanceKm: number | null;
}

export interface PickupPointsResponse {
  data: PickupPoint[];
  /** A posição que a API usou para ordenar, ou null. */
  origin: Coordinate | null;
}

// ---- Avisos da loja (CP5, notificações — Caminho B) -------------------------

/**
 * Uma entrada do histórico de envios da loja (GET /push/messages).
 * `data` é o que leva o deep link: `{ rota: 'produto', produtoId: '...' }`.
 * Os valores chegam como JSON livre, então tratamos como `unknown` e
 * convertemos para string na hora de usar (ver lib/notifications.ts).
 */
export interface StoreMessage {
  id: string;
  title: string | null;
  body: string | null;
  data: Record<string, unknown> | null;
  kind: 'NOTIFICATION' | 'DATA';
  status: 'SENT' | 'FAILED' | 'SKIPPED';
  reason: string | null;
  createdAt: string;
}

export interface StoreMessagesResponse extends Paginated<StoreMessage> {}

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
