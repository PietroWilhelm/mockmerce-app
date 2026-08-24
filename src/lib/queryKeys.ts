import type { ListProductsParams } from '@/services/products';

export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (params: ListProductsParams) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  cart: {
    all: ['cart'] as const,
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
};
