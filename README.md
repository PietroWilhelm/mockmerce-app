# DR.Mouse — app do ALUNO (CheckPoint 1)

## informaçôes importantes

membros:
Pietro Paranhos Wilhelm - rm561378

EXPO_KEY:

## Sobre a Loja 

Dr.Mouse é uma loja de Periféricos gamers de alto nível para quem procura performance e produtos high-end. 

todos os produtos são relacionados a tecnologia/Periféricos gamers

Cliente para testar: 
    nome do cliente: Pietro Buyer
    email: pietro.wilhelm@ot.com.br
    senha: Mwf94528557

## Telas 

vou dividir a explicação por seções 

### Cores e Personalização a
O app usa como cor principal roxo mais especificamente #7e17d3

o app em si é bem simples sendo bem sincero eu não sei como é o app principal pois eu não acompanhei muito o design das telas então só fui fazendo e pegando alguns modelos prontos do app principal que encontrei quando acompanhava. 


### Login, criação de conta e troca de senha
Sobre a tela de login e criação de conta.

São tela bem simples apenas apresentão o nome da loja com 2 inputText para entrar na loja e três botões para uso o de entrar quando você preencher todos os dados deixa de estar disable.

A opção de criar conta e de redefinir a senha caso tenha esquecido.

Cria conta tem um campo a mais para você colocar seu nome e a tela para troca senha onde terá duas etapas sendo a primeira digitar seu email em que vai ser enviado um codigo já na segunda etapa você digita o codigo e troca sua senha, mas para falar a verdade está funcionalidade não funciona só estar por estar mesmo. 

### Tela principal 

temos a tela principal aonde temos os produtos que vão ser exibidos para poder compra-los

tendo uma barra de pesquisa para procurar o produto que deseja.

uma lista com todos produtos dispondiveis para compra e dois botões que levam para tela de carrinho e seus pedidos;

### Tela do produto

Mostra a imagem, nome, preço e descrição do produto. Se for um produto com variação (cor/tamanho) aparecem uns "chips" pra escolher qual variante, e o preço/estoque muda de acordo com a escolha. Tem o botão "Adicionar ao carrinho" que só fica ativo se tiver estoque e você estiver logado.

### Carrinho

Lista os itens que você adicionou, com botão de +/- pra mudar quantidade e "remover" pra tirar o item. Tem uma parte de "Calcular frete" onde você digita o CEP e mostra as opções (PAC/SEDEX/Transportadora/Retirada) — dá pra clicar numa opção pra selecionar ela e o total soma o frete junto. No fim tem o total e o botão "Finalizar pedido", e embaixo botões pra ir em "Meus pedidos" ou sair da conta.

### Checkout

Confirmação antes de fechar o pedido: lista os itens de novo, mostra produtos + frete (se você tiver escolhido um na tela do carrinho) + total, com um aviso avisando que o back-end da turma só cobra o valor dos produtos mesmo (o frete é só visual, a API não integra isso no pagamento). Botão "Confirmar pedido" cria o pedido de verdade.

### Meus pedidos

Lista todos os pedidos que você já fez, com status (pendente, pago, cancelado etc.) e o total de cada um. Clica num pedido pra ver o detalhe.

### Detalhe do pedido

Mostra os itens do pedido, status do pagamento e o total. Se o pedido ainda tiver pendente, aparece a parte de pagamento: escolhe a forma (cartão/PIX/boleto) e tem botão pra "Pagar agora" ou "Simular recusa" (pra testar o caminho de pagamento recusado), além de poder cancelar o pedido. Embaixo tem a linha do tempo com o histórico de eventos do pedido.


## Dificuldades
No inicio do projeto eu não consiga roda-lo pro problema de versão do Expo entãotive que trocar a versão.


Botão de voltar quando estava fazendo o botão de voltar gerava o erro que tipo atribuível não é  no RootStackParamList, porem eu havia esquecido que a tela de login não fica na RootStackParamList mas sim na AuthStackParamList.

assim com tentei com o goBack() porem no cache interno aparentemente a tela de login não era encontrada nem considera a primeira entã usei useSession() para pode fazer o botão 


## IA
Customização base foi feita por IA, depois eu fui alterado pro meu gosto.

contudo ele fez uma coisa que não entendi ele criou um ThemeProvider com React.ReactNode. 

## CheckList

