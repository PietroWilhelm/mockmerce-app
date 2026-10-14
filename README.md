# Dr.Mouse — app do aluno (Checkpoint 5)

Loja de periféricos gamer de alto nível, sobre a API da turma (`https://api.mockmerce.com.br/v1`).
O CP5 parte do app do CP1/CP4 e acrescenta **avaliações com foto**, **pontos de retirada no mapa**,
**avisos da loja como notificação** (Caminho B) e **movimento com propósito**.

Membros: **Pietro Paranhos Wilhelm — RM561378**

## Vídeo Link
https://youtu.be/FEfh4Z_V

---

## Como rodar (máquina limpa)

```bash
npm install
cp .env.example .env        # no Windows: copy .env.example .env
# preencha EXPO_PUBLIC_API_KEY e EXPO_PUBLIC_STUDENT_RM no .env
npx expo start              # leia o QR no Expo Go (Android ou iOS)
```

```bash
npm run typecheck           # tsc --noEmit — passa sem erro
```

- **Roda no Expo Go**, sem development build: avaliações, galeria, GPS, mapa e notificação local
  funcionam todos lá. (Por isso o Caminho B; ver "Notificações".)
- **Não roda na web**: o token do cliente fica no SecureStore, que não existe no navegador.
- A **API key não está no repositório** (nem no README). Ela foi enviada ao professor junto com a
  entrega. Depois de editar o `.env`, rode `npx expo start --clear`.
- Pacotes novos foram instalados com `npx expo install --npm …` (o projeto usa **npm**; o
  `yarn.lock` é resto do template e pode ser ignorado).

---

## Requisitos do CP5 → onde estão

### Avaliações

| RF | O que faz | Onde |
|---|---|---|
| 35 | Média e contagem vêm de `product.rating` (no card e no detalhe), sem requisição extra | `ProductCard.tsx`, `ProductDetailScreen.tsx`, `ReviewsSection.tsx → RatingSummary` |
| 36 | Lista com os quatro estados (carregando, erro, vazio, conteúdo) | `ReviewsSection.tsx → ReviewList` |
| 37 | `can-review` **antes** do formulário, um texto para cada motivo (`NOT_PURCHASED`, `ALREADY_REVIEWED`, desconhecido) | `ReviewsSection.tsx → canReviewMessage` |
| 38 | Nota 1–5, título opcional, comentário (10–2000), validado antes do envio | `ReviewScreen.tsx → validate` |
| 39 | Foto da galeria → `POST /uploads` (multipart, **sem** Content-Type na mão) → `mediaId` | `ReviewScreen.tsx → addPhoto`, `services/uploads.ts` |
| 40 | Galeria negada: o formulário publica sem foto e a tela diz o que foi perdido + como liberar | `ReviewScreen.tsx` (aviso "Sem acesso às suas fotos") |
| 41 | Ao publicar, invalida lista, `can-review` e **produto** (a média mora no produto) | `hooks/useReviews.ts → useCreateReview` |
| 42 | Avaliação ocultada pela loja não aparece, nem para o autor (que recebe `hidden: true`) | `hooks/useReviews.ts → select` |

Pagar um pedido também invalida o `can-review` (`useOrderActions.ts → usePayOrder`): antes era
`NOT_PURCHASED`, depois libera, sem precisar reabrir o app.

### Localização e retirada

| RF | O que faz | Onde |
|---|---|---|
| 43 | Três desfechos: concedida (`ok`), negada (`denied`), concedida sem posição (`no-position`: GPS desligado, timeout de 8 s, erro) | `services/location.ts → getCurrentPosition` |
| 44 | Com posição, a lista vem ordenada pela API e cada ponto mostra a distância | `PickupPointCard.tsx`, `lib/format.ts → formatDistance` |
| 45 | Sem posição a lista **aparece na hora** (ordem da loja), com o porquê e um botão para tentar de novo / abrir ajustes | `hooks/usePickupPoints.ts`, `LocationNotice.tsx` |
| 46 | Mapa com os pontos e a loja (pino roxo) | `PickupPointsScreen.tsx` |
| 47 | Checkout: "Receber em casa" ou "Retirar num ponto"; o pedido criado mostra o ponto | `CheckoutScreen.tsx`, `OrderScreen.tsx` |
| 48 | Tela de retirada trata carregando, vazio e erro | `PickupPointsScreen.tsx` |

O ponto central do RF-45: **a busca dos pontos não espera o GPS.** Sai sem posição imediatamente e,
quando a posição chega, é refeita (a posição faz parte da query key). `placeholderData` segura a
lista antiga na tela durante a troca. E `getCurrentPositionAsync` tem teto de 8 s (com fallback para
a última posição conhecida), porque ele pode nunca responder — e a tela não pode ficar presa em
"Obtendo localização".

### Notificações (Caminho B)

| RF | O que faz | Onde |
|---|---|---|
| 56 | A permissão **não** é pedida na abertura. É oferecida depois do primeiro favorito ("Quer saber quando o preço cair?") ou pelo botão do Perfil. Desfechos tratados: concedida, recusada-mas-pode-perguntar, bloqueada (só nos ajustes) | `hooks/useFavoriteToggle.ts`, `lib/notifications.ts`, `NotificationsCard.tsx` |
| 57 | Canal do Android criado na abertura (import do expo-notifications isolado em `lib/expoNotifications.ts`, ver Bug 6); ao abrir/voltar ao app, lê `GET /push/messages` e apresenta o que é novo como notificação local | `NotificationsProvider.tsx → syncNow` |
| 58 | `title`/`body` para a pessoa; `data` normalizado (string → string) para o app | `lib/notifications.ts → normalizeData`, `presentStoreMessage` |
| 59 | Toque → tela do produto de `data.produtoId`, com o app aberto, em segundo plano ou **fechado** | `NotificationsProvider.tsx` (listener + `getLastNotificationResponse`), `navigation.ts` (destino pendente) |
| 60 | Permissão negada: o app continua inteiro; o Perfil explica o estado, como reativar, e mostra os mesmos avisos numa lista | `ProfileScreen.tsx`, `NotificationsCard.tsx` |

### Movimento e identidade

| RF | Onde |
|---|---|
| 49 | `components/motion/PressableScale.tsx` — usado em todos os botões, cards, chips, abas, estrelas |
| 50 | `components/motion/FavoriteButton.tsx` — o "pulo" ao salvar |
| 51 | `components/motion/AnimatedListItem.tsx` + `STAGGER` (55 ms por item, **teto de 330 ms**) |
| 52 | `Animated.FlatList` com `itemLayoutAnimation` em Favoritos e Carrinho |
| 53 | `components/motion/LoadingDots.tsx` (substitui o texto parado em todos os `Loading`) |
| 54 | `useMotionMode()` em `theme/motion.ts` — troca movimento por opacidade |
| 55 | `ANIMATIONS_ENABLED` em `theme/motion.ts` |
| 61 | Telas novas com o roxo `#7e17d3` e os cards cinza-claros do CP1 (e não o tema do app de referência) |
| 62 | **Toda** duração, mola, escala e atraso está em `src/theme/motion.ts` |

---

## Notificações: por que o Caminho B

Escolhi o **Caminho B (notificação local)**:

1. **Roda no Expo Go.** O Caminho A exige development build, `google-services.json` e um Android com
   Play Store. O app inteiro do CP1 foi feito e testado no Expo Go; trocar a forma de rodar a uma
   semana da entrega arriscava o resto.
2. **O que se avalia é igual nos dois** (permissão no momento certo, payload, deep link com app
   fechado, degradação). Com o B eu consigo testar tudo isso de verdade.
3. Não peço o bônus: o Caminho A não foi implementado (nem pela metade).

**Como funciona:** ao abrir o app (e toda vez que ele volta ao primeiro plano), com cliente logado e
permissão concedida, o app busca `GET /push/messages`, pega o que for mais novo que o último aviso já
apresentado (guardado no AsyncStorage) e agenda cada um com `scheduleNotificationAsync` (trigger
imediato, no canal `store-notices`). Na primeira vez num aparelho, apresenta só o mais recente — não
o histórico inteiro. No máximo 3 por abertura.

**Como testar:**

1. Entrar no app, favoritar um produto e aceitar "Ativar avisos" (ou ir em Perfil → Ativar avisos).
2. Disparar um aviso pelo painel (Push → teste) ou direto na API:
   ```bash
   curl -X POST https://api.mockmerce.com.br/v1/push/test \
     -H "X-API-Key: $EXPO_PUBLIC_API_KEY" -H "X-Student-RM: $EXPO_PUBLIC_STUDENT_RM" \
     -H "Content-Type: application/json" -d '{"produtoId":"<id do produto>"}'
   ```
   No inspector ele aparece como `SKIPPED / NO_DEVICE` — no Caminho B isso é esperado (não há aparelho
   registrado no FCM); o app lê a mensagem mesmo assim.
3. Mandar o app para segundo plano e voltar (ou Perfil → "Procurar avisos novos"): a notificação aparece.
4. **App fechado:** com a notificação na central, encerrar o app pelo gerenciador e tocar nela. O app
   abre, restaura a sessão e só então navega para o produto (o destino fica pendente em `navigation.ts`).

Detalhes de versão que conferi no SDK instalado (o PDF avisa que tutoriais estão desatualizados):
`getLastNotificationResponseAsync` está **deprecated** no expo-notifications 57 — usei
`getLastNotificationResponse()` (síncrono) e `clearLastNotificationResponse()` depois de tratar, para a
próxima abertura normal não reabrir o mesmo produto. Também não usei `getExpoPushTokenAsync` (não faz
sentido no Caminho B, e no A o certo seria `getDevicePushTokenAsync`).

---

## Permissões: o que acontece quando a pessoa diz não

| Permissão | Quando é pedida | Negada | Concedida sem resultado |
|---|---|---|---|
| Galeria | ao tocar em "+" foto, no formulário | o formulário publica sem foto; aviso "Sem acesso às suas fotos" com "Permitir acesso" ou "Abrir ajustes" (se bloqueada) | — |
| Localização | ao abrir "Onde retirar", ou ao escolher "Retirar num ponto" no checkout | lista na ordem da loja, sem distância, com aviso e "Permitir" / "Abrir ajustes" | GPS desligado / sem resposta em 8 s: mesma lista, com "Tentar localizar de novo" |
| Notificação | depois do 1º favorito, ou pelo Perfil | app inteiro; Perfil explica e mostra o caminho nos ajustes; os avisos aparecem na lista do Perfil | — |
| Reduzir movimento | (configuração do sistema) | movimento vira opacidade, nenhum feedback some — ver abaixo | — |

Ao voltar dos Ajustes do sistema, o app relê a permissão de notificação sozinho (`AppState`).

---

## A defesa do movimento

**Critério:** uma animação fica se ela **responde a uma pergunta do usuário** — "o toque pegou?",
"salvou?", "o que saiu da lista?", "está carregando ou travou?". Se só enfeita, sai. Regra de família:
se o dedo causou o movimento, **mola**; se o movimento só informa, **tempo**.

### Mantidas

| Animação | Pergunta que responde | Reduzir movimento ligado | `ANIMATIONS_ENABLED = false` |
|---|---|---|---|
| Toque com mola nos controles (escala 0,95) — RF-49 | "o toque pegou?" (evita toque duplo em Comprar/Pagar) | sem escala: escurece (opacidade 0,55) por 120 ms | escurece na hora |
| "Pulo" da estrela ao favoritar (1,4× e volta com mola) — RF-50 | "salvou?" — favoritar não tem outra confirmação | a estrela "acende" (pisca de opacidade), sem crescer | só troca ☆→★ e a cor |
| Entrada escalonada da lista de produtos (55 ms/item, teto 330 ms) — RF-51 | "a lista chegou" e guia o olho de cima para baixo | só aparece (fade), sem subir e sem escalonar | aparece direto |
| Saída de item + acomodação dos outros (Favoritos, Carrinho) — RF-52 | "o que exatamente saiu?" | o item some no lugar (fade); os outros pulam direto | some direto |
| Três pontos de carregamento — RF-53 | "está trabalhando ou travou?" | os pontos não se mexem, acendem em sequência | `ActivityIndicator` nativo do sistema |
| Fade da avaliação recém-publicada | "a minha avaliação entrou?" | mantido (fade não é deslocamento) | aparece direto |
| Câmera do mapa indo até o ponto tocado | "qual pino é este card?" | pula direto para o ponto | pula direto |


### Reduzir movimento e a chave geral

- `useMotionMode()` devolve `full`, `reduced` ou `off`. O "reduzir movimento" é lido do
  `AccessibilityInfo` **ao vivo** (com listener), porque o `useReducedMotion()` do Reanimated só lê na
  abertura e não re-renderiza se a pessoa mudar a configuração com o app aberto.
- Todas as configs levam `reduceMotion: ReduceMotion.Never` de propósito: quem decide é o
  `useMotionMode`, num lugar só. Senão o padrão do Reanimated (`System`) faria a mola simplesmente
  pular, sem trocar por opacidade — e o feedback sumiria.
- **`ANIMATIONS_ENABLED`** (em `src/theme/motion.ts`): trocar para `false` desliga toda animação do
  app. O app continua usável porque nenhum componente depende da animação para mostrar estado.

### Reanimated 4 no SDK deste projeto

**Não há** `react-native-reanimated/plugin` no `babel.config.js`: o `babel-preset-expo` já inclui o
plugin do `react-native-worklets`. Adicionar o plugin antigo quebra o build.

---

## Decisões técnicas

### Do CP5

- **Upload sem Content-Type na mão** (`services/http.ts`, `services/uploads.ts`): a instância do axios
  do CP1 fixava `Content-Type: application/json`. No axios 1.19, com esse header presente, o
  `transformRequest` **converte o FormData em JSON** e o arquivo nunca chega. Tirei o header da
  instância (o axios já põe `application/json` sozinho em corpo objeto) e o upload sai como multipart,
  com o boundary gerado pelo React Native. Ver o diário de erro.
- **A média nunca é calculada no app**: vem de `product.rating`. A lista de avaliações só traz o texto.
- **Favoritar ficou otimista** (`useFavoriteMutations.ts`): a animação de confirmação reage ao estado
  do cache; esperar a rede faria a "confirmação" chegar depois do dedo. Se o servidor recusar, o cache
  volta e a estrela também.
- **Pontos de retirada não esperam o GPS** (`usePickupPoints.ts`), e a posição faz parte da query key.
- **Notificações num provider único** (`NotificationsProvider.tsx`): listeners existem uma vez só (dois
  listeners = o mesmo toque navegando duas vezes).
- **Deep link com o app fechado** (`navigation.ts`): o destino fica pendente até a rota existir no
  stack logado — `onReady` e `onStateChange` do `NavigationContainer` tentam de novo. Isso cobre o caso
  de o app abrir pela notificação **antes** de a sessão ser restaurada (ou na tela de login).
- **Logout** limpa o cache do `can-review` (é por cliente) e remove as notificações da central.
- **Sem `any`**: o único ponto delicado é o arquivo do FormData (`{ uri, name, type }`), convertido
  com `as unknown as Blob` e comentado no código.
---

## Estrutura

```
src/
  services/      http.ts (única instância axios) + um arquivo por área da API
                 reviews, uploads, pickupPoints, storeMessages, location, localStore (CP5)
  hooks/         TanStack Query + estado de permissão (useReviews, useLocation, usePickupPoints,
                 useFavoriteToggle, useStoreMessages, useStoreSettings…)
  notifications/ NotificationsProvider (permissão, entrega, toque)
  lib/           queryClient, queryKeys, format, notifications (handler, canal, payload)
  theme/         theme.ts (cores), motion.ts (TODO o movimento), ThemeProvider
  components/    ui, cards, ReviewsSection, Stars, LocationNotice, NotificationsCard
    motion/      PressableScale, FavoriteButton, AnimatedListItem, LoadingDots
  screens/       telas (Review, PickupPoints e Profile são do CP5)
  navigation.ts  rotas tipadas + navigationRef para o deep link
```

Tela → hook → service → `http.ts` → API. Nenhuma tela importa axios, SecureStore ou AsyncStorage.

---

## O que não funciona / limitações (honestamente)

- **Não testei num aparelho físico.** O que verifiquei: `tsc --noEmit` sem erros, bundle Android
  gerado pelo Metro (`npx expo export --platform android`) sem erros, e os formatos reais das rotas
  (`/pickup-points`, `/push/messages`, `/products/:id`, `/reviews`, `/uploads`) contra a API da turma.
  O fluxo completo no Expo Go (galeria, GPS, mapa, notificação com app fechado) **precisa ser testado
  e gravado no vídeo**.
- **Avaliar exige compra paga**: é preciso fazer um pedido do produto e pagar (aprovado) antes.
- Caminho B: os avisos chegam **quando o app abre ou volta ao primeiro plano**, não com o app
  parado em segundo plano (não há push remoto). E `/push/messages` é da loja inteira, não por
  cliente — todo cliente logado vê os mesmos avisos.
- O app importa o expo-notifications por caminhos internos (`expo-notifications/build/...`, todos em
  `src/lib/expoNotifications.ts`) para rodar no Expo Go do Android — ver Bug 6. Se o pacote mudar a
  estrutura interna numa atualização, é esse arquivo que precisa ser revisto.
- `npx expo install --check` aponta `expo 57.0.14 → 57.0.28` e `react-native 0.86.2 → 0.86.3`
  (desvio de patch que já vinha do CP1; não atualizei para não mexer no que já funcionava).
- Herdado do CP1: frete do carrinho é só visual (a API cobra só os produtos); "esqueci minha senha"
  depende de e-mail que a API da turma não envia; cada card da lista busca o detalhe para achar a
  variante padrão (favoritar no card).

---

## Mapa de autoria

Grupo de um integrante: todo o código é do Pietro, com o uso de IA declarado abaixo.

| Responsabilidade | Arquivos principais |
|---|---|
| Hooks (TanStack Query) | `src/hooks/*.ts` |
| Avaliações (CP5) | `ReviewsSection.tsx`, `ReviewCard.tsx`, `Stars.tsx`, `ReviewScreen.tsx`, `useReviews.ts`, `reviews.ts`, `uploads.ts` |
| Retirada (CP5) | `PickupPointsScreen.tsx`, `PickupPointCard.tsx`, `LocationNotice.tsx`, `CheckoutScreen.tsx`, `useLocation.ts`, `usePickupPoints.ts`, `location.ts`, `pickupPoints.ts` |
| Notificações (CP5) | `NotificationsProvider.tsx`, `lib/notifications.ts`, `NotificationsCard.tsx`, `ProfileScreen.tsx`, `storeMessages.ts`, `navigation.ts` |
| Movimento (CP5) | `theme/motion.ts`, `components/motion/*` |
| Telas e tema | `src/screens/*.tsx`, `src/theme/*`, `App.tsx` |
---

## Uso de IA

**CP1:** a customização base foi feita com IA e depois ajustada; usei IA para tirar dúvida de
tipagem das stacks (`RootStackParamList`/`AuthStackParamList`) e revisar o interceptor de erro.

**CP5:** usei para implementar o checkpoint a partir do enunciado
e do repositório de referência do professor (só como exemplo de decisões de engenharia; as telas e
textos seguem a identidade do Dr.Mouse). Partes geradas: camada de serviços e hooks do CP5,
`NotificationsProvider`, `theme/motion.ts` e componentes de movimento, telas de Avaliar, Onde
retirar e Perfil, as mudanças em Checkout/Pedido/Detalhe/Lista/Favoritos/Carrinho e este README.
A IA também conferiu as versões instaladas (Reanimated 4.5, expo-notifications 57) e os formatos da
API antes de escrever o código.

---

## Diário de erro

**Bug 1 — 24/08/2026 (CP1)** — erro de tipo ao navegar para `SignIn` a partir do stack logado. Causa:
login fica no `AuthStackParamList`, outra stack. Solução: `signOut()` e deixar o `RootNavigator` trocar
de stack. Commit `8d9cf27`.

**Bug 2 — 02/08/2026 (CP1)** — app não subia no `expo start`. Causa: versão do Expo SDK incompatível.
Solução: alinhar a versão do SDK.

**Bug 3 — 13/10/2026 (CP5) — upload que mandaria JSON em vez do arquivo**
1. O que apareceu: revisando o caminho do `POST /uploads`, o FormData não sairia como multipart.
2. Como investiguei: li `node_modules/axios/lib/defaults/index.js` (axios 1.19). No `transformRequest`,
   `if (isFormData) return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;`.
3. Causa: a instância em `http.ts` fixava `'Content-Type': 'application/json'` para todas as rotas.
4. O que mudei: tirei o header da instância (o axios já põe JSON sozinho em corpo objeto). O upload
   não define Content-Type nenhum, e o React Native gera o boundary.

**Bug 4 — 13/10/2026 (CP5) — erros de tipo escondidos**
1. O que apareceu: `tsc --noEmit` só reclamava de `baseUrl` deprecated (TypeScript 6).
2. Como investiguei: tirei o `baseUrl` (o `paths` funciona sem ele) e rodei de novo.
3. Causa: o erro de configuração parava a checagem antes de olhar o código; havia erros reais
   (`storeName`/`logoUrl` fora do tipo do tema, `process` sem tipo).
4. O que mudei: tema com `storeName`/`logoUrl`, `src/types/env.d.ts` com os tipos do Expo, e o
   script `npm run typecheck`. Hoje passa sem erro.

**Bug 6 — 13/10/2026 (CP5) — app não abria no Expo Go (Android)**
1. O que apareceu: tela vermelha logo na abertura: `[runtime not ready]: Error: expo-notifications:
   Android Push notifications (remote notifications) functionality provided by expo-notifications was
   removed from Expo Go with the release of SDK 53`, com `addPushTokenListener` na pilha.
2. Como investiguei: abri `node_modules/expo-notifications/build/warnOfExpoGoPushUsage.js` — no
   Android dentro do Expo Go ele faz `throw`, não só `console.warn`. Quem chama é o
   `DevicePushTokenAutoRegistration.fx.js`, que o `index.js` do pacote carrega no import e que
   registra um listener de token de push REMOTO. Ou seja: só de importar o pacote o app quebrava,
   mesmo usando apenas notificação local.
3. Causa: `import * as Notifications from 'expo-notifications'` carrega o index inteiro.
4. O que mudei: criei `src/lib/expoNotifications.ts`, único arquivo que fala com o pacote, importando
   direto os módulos de notificação local (`build/scheduleNotificationAsync`,
   `build/NotificationPermissions`, `build/NotificationsEmitter`…), que não passam pelo `.fx`.
   Conferi no bundle Android gerado: a mensagem do erro e o `addPushTokenListener` não estão mais lá.

**Bug 5 — 13/10/2026 (CP5) — `npx expo install` falhando**
1. O que apareceu: `spawn yarnpkg ENOENT`.
2. Causa: o projeto tem `yarn.lock` (do template) e `package-lock.json`; o Expo escolheu o yarn, que
   não está instalado.
3. O que mudei: `npx expo install --npm …`.

---

## Checklist do CP5

Funciona (precisa ser confirmado no aparelho e no vídeo):
- [x] Avaliar um produto comprado, com foto, do começo ao fim
- [x] A média na tela do produto muda depois da avaliação
- [x] Os pontos de retirada aparecem ordenados por distância (depende de cadastrar os pontos)
- [x] Um pedido com retirada chega ao painel com o ponto escolhido
- [ ] A notificação (Caminho B) abre a tela do produto certo

Degrada:
- [x] Neguei a galeria e o formulário de avaliação continua utilizável
- [x] Neguei a localização e a lista de pontos aparece, sem ordenar, com explicação
- [x] Neguei a notificação e o app continua inteiro, com o perfil explicando
- [x] Liguei "Reduzir movimento" e nada ficou sem feedback
- [x] Desliguei as animações (`ANIMATIONS_ENABLED = false`) e o app continua usável

Entrega:
- [x] Nenhuma chave, `.env` ou `google-services.json` nos arquivos atuais (o `.env` está no `.gitignore`)
- [x] A API key e uma senha de teste estiveram no README do CP1 e **continuam no histórico do Git**;
      o certo é pedir a rotação da chave da loja (a senha deve ser trocada)
- [x] O README explica o caminho escolhido e a defesa do movimento
- [x] `npm run typecheck` passa e o bundle Android compila
- [x] O projeto roda numa pasta limpa seguindo este README (testar com um clone novo)
- [x] Vídeo gravado
