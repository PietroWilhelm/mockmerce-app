import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { canReview, createReview, listReviews } from '@/services/reviews';
import { queryKeys } from '@/lib/queryKeys';
import { useSession } from '@/session/session';
import type { NewReview } from '@/types/api';

/**
 * Lista de avaliações. Atenção: a MÉDIA não sai daqui — ela vem do próprio
 * produto (`product.rating`, RF-35). Aqui é só o texto de cada avaliação.
 */
export function useReviews(productId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.list(productId),
    queryFn: () => listReviews(productId),
    enabled: Boolean(productId),
    // RF-42: o autor recebe a própria avaliação ocultada com `hidden: true`.
    // Ocultada pela loja não aparece no app — nem para quem escreveu.
    select: (response) => ({
      ...response,
      visible: response.data.filter((review) => !review.hidden),
      mine: response.data.find((review) => review.isMine) ?? null,
    }),
  });
}

/**
 * RF-37: pergunta ANTES de oferecer o formulário. `enabled` com sessão porque
 * a rota exige token — sem ele viria 401, e o interceptor derrubaria a sessão.
 */
export function useCanReview(productId: string) {
  const { isLoggedIn } = useSession();
  return useQuery({
    queryKey: queryKeys.reviews.canReview(productId),
    queryFn: () => canReview(productId),
    enabled: isLoggedIn && Boolean(productId),
  });
}

export function useCreateReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (review: NewReview) => createReview(productId, review),
    onSuccess: () => {
      // RF-41: três caches ficaram velhos de uma vez —
      //   a lista (falta a nova), o can-review (agora ALREADY_REVIEWED) e o
      //   PRODUTO (a média mudou; ela vem de GET /products/:id).
      // `products.all` cobre o detalhe e as listagens, que também mostram a nota.
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
