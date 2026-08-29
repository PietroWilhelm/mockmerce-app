# Dr.Mouse — app do ALUNO (CheckPoint 4)

## Informações importantes

Membros:
Pietro Paranhos Wilhelm - rm561378

EXPO_KEY (API key da loja, para rodar o app):
```
EXPO_PUBLIC_API_URL=https://api.mockmerce.com.br
EXPO_PUBLIC_API_KEY=sk_live_c202a01d1a82d91b3dcf4c77465010f3da10e83092996e04
EXPO_PUBLIC_STUDENT_RM=RM561378
```

## Mapa de autoria

Como o grupo fechou só com um integrante, todo o app (camada de API, hooks, telas e tema) é meu.

| Responsabilidade | Arquivos principais |
|---|---|
| Camada de API (axios, interceptors, serviços) | `src/services/http.ts`, `src/services/auth.ts`, `src/services/products.ts`, `src/services/cart.ts`, `src/services/orders.ts`, `src/services/store.ts`, `src/services/shipping.ts` |
| Hooks (TanStack Query) | `src/hooks/*.ts` |
| Sessão / autenticação | `src/session/session.tsx` |
| Telas | `src/screens/*.tsx` |
| Tema e navegação | `src/theme/*.ts(x)`, `src/navigation.ts`, `App.tsx` |

## Como rodar

```bash
npm install
cp .env.example .env      # ou copiar manualmente no Windows
# preencher .env com os valores da seção "EXPO_KEY" acima
npm start                 # aperta "a" pro Android, "i" pro iOS, ou lê o QR no Expo Go
```

Não precisa configurar IP nem rodar backend local: o `.env.example` já aponta pra API na nuvem (`https://api.mockmerce.com.br`).

## Acesso à loja

A API key da loja do grupo está na seção "EXPO_KEY" lá em cima (é a mesma que está em `.env` na minha máquina, que não sobe pro repositório).

## Credenciais de teste

```
e-mail: pietro.wilhelm@ot.com.br
senha: Mwf94528557
```

## Sobre a Loja

Dr.Mouse é uma loja de Periféricos gamers de alto nível para quem procura performance e produtos high-end.

Todos os produtos são relacionados a tecnologia/Periféricos gamers.

## Decisões de produto

Que loja é essa: uma loja de periféricos gamer (mouse, teclado, headset, mousepad) voltada pra quem já sabe o que quer e busca produto top de linha, não entrada. Por isso o catálogo é enxuto e as telas priorizam mostrar variante (cor/tamanho), preço e estoque de forma direta, sem enfeite.

## Decisões técnicas

- **Instância única de axios com interceptors** (`src/services/http.ts`): toda chamada passa por um único cliente com `X-API-Key`/`X-Student-RM` fixos, injeção de `Authorization` via interceptor de request e normalização de erro (`ApiError`) via interceptor de response. Nenhuma tela importa `axios` diretamente — commit `0cdbe8f`.
- **TanStack Query pra tudo que é busca** (`src/lib/queryClient.ts`, `src/hooks/*`): sem `useEffect` de fetch. `retry` é desligado pra erros 4xx (não adianta insistir num 401/404) e mantido pra erros de servidor/rede — commit `0cdbe8f`.
- **Query keys centralizadas** (`src/lib/queryKeys.ts`): quem lê e quem invalida (ex. carrinho depois de um checkout) usa a mesma chave, pra não ter tela desatualizada por chave divergente.
- **Pagamento e checkout sem atualização otimista** (`src/hooks/useOrderActions.ts`): dinheiro e estoque não se adivinham, então essas mutations só atualizam o cache depois da resposta do servidor — diferente do carrinho, que pode ser otimista.
- **Tema vindo da API** (`src/theme/ThemeProvider.tsx`): cor primária e nome da loja são buscados em `GET /v1/store/settings` com `useQuery`, caindo pro tema padrão (`#7e17d3`, "Dr.Mouse") se a chamada falhar — commit `98fc587`.
- **Botão de voltar usando a sessão, não `navigation.goBack()`** (`src/screens/ProductsScreen.tsx`): expliquei o motivo real no diário de erro abaixo — commit `8d9cf27`.

## Telas

Vou dividir a explicação por seções.

### Cores e Personalização

O app usa como cor principal roxo, mais especificamente #7e17d3.

O app em si é bem simples, sendo bem sincero eu não sei como é o app principal pois eu não acompanhei muito o design das telas, então só fui fazendo e pegando alguns modelos prontos do app principal que encontrei quando acompanhava.

### Login, criação de conta e troca de senha

Sobre a tela de login e criação de conta.

São telas bem simples, apenas apresentando o nome da loja com 2 inputText para entrar na loja e três botões para uso, o de entrar quando você preencher todos os dados deixa de estar disable.

A opção de criar conta e de redefinir a senha caso tenha esquecido.

Criar conta tem um campo a mais para você colocar seu nome, e a tela de troca de senha onde terá duas etapas, sendo a primeira digitar seu email em que vai ser enviado um código, já na segunda etapa você digita o código e troca sua senha — mas para falar a verdade essa funcionalidade não funciona, só está por estar mesmo (a API da turma não tem esse fluxo).

### Tela principal

Temos a tela principal, aonde temos os produtos que vão ser exibidos para poder comprá-los.

Tendo uma barra de pesquisa para procurar o produto que deseja.

Uma lista com todos produtos disponíveis para compra e dois botões que levam para a tela de carrinho e de pedidos.

### Tela do produto

Mostra a imagem, nome, preço e descrição do produto. Se for um produto com variação (cor/tamanho) aparecem uns "chips" pra escolher qual variante, e o preço/estoque muda de acordo com a escolha. Tem o botão "Adicionar ao carrinho" que só fica ativo se tiver estoque e você estiver logado.

### Carrinho

Lista os itens que você adicionou, com botão de +/- pra mudar quantidade e "remover" pra tirar o item. Tem uma parte de "Calcular frete" onde você digita o CEP e mostra as opções (PAC/SEDEX/Transportadora/Retirada) — dá pra clicar numa opção pra selecionar ela e o total soma o frete junto. No fim tem o total e o botão "Finalizar pedido", e embaixo botões pra ir em "Meus pedidos" ou sair da conta.

### Checkout

Confirmação antes de fechar o pedido: lista os itens de novo, mostra produtos + frete (se você tiver escolhido um na tela do carrinho) + total, com um aviso avisando que o back-end da turma só cobra o valor dos produtos mesmo (o frete é só visual, a API não integra isso no pagamento). Botão "Confirmar pedido" cria o pedido de verdade.

### Meus pedidos

Lista todos os pedidos que você já fez, com status (pendente, pago, cancelado etc.) e o total de cada um. Clica num pedido pra ver o detalhe.

### Detalhe do pedido

Mostra os itens do pedido, status do pagamento e o total. Se o pedido ainda estiver pendente, aparece a parte de pagamento: escolhe a forma (cartão/PIX/boleto) e tem botão pra "Pagar agora" ou "Simular recusa" (pra testar o caminho de pagamento recusado), além de poder cancelar o pedido. Embaixo tem a linha do tempo com o histórico de eventos do pedido.

## Uso de IA

Customização base foi feita por IA, depois eu fui alterando pro meu gosto.

Contudo ela fez uma coisa que não entendi: criou um `ThemeProvider` com `React.ReactNode` como tipo de `children` em vez de `PropsWithChildren` — deixei do jeito que estava porque funciona, mas é o tipo de coisa que eu teria escrito diferente se tivesse feito do zero.

Usei IA também pra tirar dúvida de erro do TypeScript (tipagem do `RootStackParamList`/`AuthStackParamList`) e pra revisar o interceptor de erro do axios (o formato `{ error: { code, message } }`). O código final eu li, entendi e ajustei — não colei sem olhar.

## Diário de erro

**Bug 1 — 24/08/2026**

1. O que apareceu: erro de tipo `Argument of type '"SignIn"' is not assignable to parameter of type...` ao tentar usar `navigation.goBack()`/`navigate("SignIn")` no botão de voltar, reclamando que o tipo não era atribuível a `RootStackParamList`.
2. Como investiguei: primeiro achei que era erro de digitação no nome da rota, conferi o `navigation.ts` de novo e o nome batia.
3. Causa: a tela de login não fica no `RootStackParamList`, fica no `AuthStackParamList` — são duas stacks separadas (`AuthFlow` e `AppFlow` em `App.tsx`), e eu estava tentando navegar de uma pra outra como se fosse a mesma.
4. O que mudei: em vez de navegar direto pra tela de login, usei `useSession()` e chamei `signOut()`, deixando o `RootNavigator` trocar de stack sozinho. Commit `8d9cf27`.

**Bug 2 — 02/08/2026**

1. O que apareceu: o app não subia de jeito nenhum, dava erro logo no `expo start`.
2. Como investiguei: olhei a versão do Expo instalada contra a que o projeto pedia, descartei erro de código porque nem chegava a renderizar nada.
3. Causa: incompatibilidade de versão do Expo SDK.
4. O que mudei: troquei a versão do Expo/SDK pra bater com o que o projeto precisa, aí subiu normal.

## Limitações conhecidas

- Token do comprador ainda fica só em memória (variável em `src/services/http.ts`), não está em `expo-secure-store`. Isso significa que fechar e reabrir o app derruba a sessão — RF-11/RF-12 ainda não atendidos.
- Não existe tela de favoritos nem integração com `/v1/customers/me/favorites` ainda.
- Cache do TanStack Query não é persistido localmente (sem modo avião funcionando pra dados já carregados).
- A tela de "esqueci minha senha" existe visualmente mas não é funcional — a API da turma não tem esse fluxo.
- O frete calculado no carrinho é só visual: a API não cobra o valor do frete no pagamento, só o dos produtos (isso já é avisado na tela de checkout).

## Checklist

- [x] TypeScript obrigatório, sem `any` no código
- [x] Checagem de tipos roda sem erro de tipo (só um aviso de depreciação do `baseUrl` no `tsconfig.json`)
- [x] Instância única de axios, nenhuma tela importa `axios` diretamente
- [x] Interceptor de request injeta `Authorization` e o remove sem sessão
- [x] Interceptor de response normaliza erro em `ApiError`
- [x] Todas as buscas usam TanStack Query, sem `useEffect` de fetch
- [x] `.env` fora do repositório, com `.env.example` preenchido em branco
- [x] Cadastro, login, carrinho, checkout, pagamento (aprovado e recusado) e histórico de pedidos funcionando
- [x] Token em `expo-secure-store` (ainda em memória)
- [x] Sessão validada/persistida na abertura via `GET /v1/auth/me`
- [x] Favoritos (tela e integração com a API)
- [ ] Cache do Query persistido localmente (modo avião)
- [ ] Recuperação de senha funcional
