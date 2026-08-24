import { http } from './http';
import type { Paginated, Product, ProductSummary } from '@/types/api';

export interface ListProductsParams {
  search?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}

export async function listProducts(params: ListProductsParams = {}): Promise<Paginated<ProductSummary>> {
  const { data } = await http.get<Paginated<ProductSummary>>('/products', { params });
  return data;
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await http.get<Product>(`/products/${id}`);
  return data;
}