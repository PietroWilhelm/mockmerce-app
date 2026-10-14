import type { ListProductsParams } from '@/services/products';
import type { Coordinate } from '@/types/api';

export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (params: ListProductsParams) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  cart: {
    all: ['cart'] as const,
  },
  favorites: {
    all: ['favorites'] as const,
    list: () => ['favorites', 'list'] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: () => ['orders', 'list'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    timeline: (id: string) => ['orders', 'timeline', id] as const,
  },
  store: {
    settings: ['store', 'settings'] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    list: (productId: string) => ['reviews', 'list', productId] as const,
    // can-review depende de QUEM está logado: sai do cache no logout.
    canReview: (productId: string) => ['reviews', 'can-review', productId] as const,
  },
  pickupPoints: {
    all: ['pickup-points'] as const,
    // A posição entra na chave: a lista "sem posição" e a "ordenada" são
    // respostas diferentes e não podem dividir a mesma entrada de cache.
    list: (position: Coordinate | null) =>
      ['pickup-points', position?.latitude ?? null, position?.longitude ?? null] as const,
  },
  storeMessages: {
    all: ['store-messages'] as const,
  },
};
