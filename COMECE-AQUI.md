# Comece aqui 👋 — Semana 2 (TanStack Query)

Este é o app do seu grupo **no estado final da Semana 1**: ele lista produtos e abre
o detalhe, buscando dados **na mão** (`useState` + `useEffect`). O carrinho é um
placeholder. Sua missão nesta semana é transformar este app no app "de produto":
com **cache, revalidação e carrinho otimista** — usando **TanStack Query**.

## 1. Rodar (5 min)

```bash
npm install
cp .env.example .env      # preencha URL, API Key e RM do SEU grupo
npm start                 # leia o QR no Expo Go, ou aperte a / i
```

> **URL da API:** o padrão já é o backend **na nuvem** (`https://api.mockmerce.com.br`) —
> funciona em qualquer plataforma, sem configurar IP. Só precisa preencher API Key e RM do
> seu grupo. (Localhost/`10.0.2.2` só se você mesmo rodar o backend — ver `.env.example`.)

Abra o app: você deve conseguir **buscar produtos e abrir um produto**. É daqui que a gente parte.

## 2. O que existe (não mexa, é a Semana 1)

```
src/services/   http.ts, products.ts, cart.ts, auth.ts   ← camada de serviços pronta
src/types/      api.ts                                    ← tipos da API
src/components/  ui.tsx        src/lib/format.ts          ← UI e utilitários
```

## 3. O que VOCÊ vai criar (a Semana 2)

Estes arquivos **não existem ainda** — você cria seguindo o `../exercicios.md`:

| Quando | Arquivo a criar | Exercício |
|---|---|---|
| **Segunda** (dever) | `src/lib/queryClient.ts` + ligar `<QueryClientProvider>` no `App.tsx` | §1.1 |
| **Segunda** (dever) | `src/lib/queryKeys.ts` e `src/hooks/useProducts.ts`; migrar `ProductsScreen` | §1.2–1.3 |
| **Quarta** Bloco 1 | `src/hooks/useProduct.ts`; migrar `ProductDetailScreen` | §2 B1 |
| **Quarta** Bloco 2 | `src/session/session.tsx` + `src/hooks/useCart.ts` (login + carrinho) | §2 B2 |
| **Quarta** Bloco 3 | `src/hooks/useCartMutations.ts` (otimista) + construir `CartScreen` | §2 B3 |

Cada tela a migrar tem um comentário `>>> SEU TRABALHO <<<` no topo apontando o caminho.

## 4. Regras de ouro

- **A unidade vendável é a VARIANTE.** Carrinho usa `variantId`; preço/estoque vêm em
  `product.variants[]` (o detalhe), não na listagem.
- **Quem lê e quem invalida usam a MESMA query key.** Centralize em `queryKeys.ts`.
- **Sem `any`** sem justificativa documentada (penalidade nos checkpoints).

## 5. Travou?

Confira o app pronto do professor em `../app-professor-completo/` — mas tente **antes**
de olhar. A ideia de quarta é chegar com dúvida real.
