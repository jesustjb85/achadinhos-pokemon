# Achadinhos Pokémon

Landing page simples (HTML/CSS/JS puro, sem build, sem framework) para converter
visitantes em membros do grupo do WhatsApp de cupons e achadinhos de cartas Pokémon.

## Como editar o link do WhatsApp

Abra [script.js](script.js) e troque a constante `WHATSAPP_LINK` pelo link real
do seu grupo/comunidade (ex: `https://chat.whatsapp.com/XXXXXXXXXXXXXXXXXXXXXX`).
Todos os botões da página usam esse mesmo valor — não precisa editar o HTML.

## Como exibir o número de membros

Em [script.js](script.js), preencha a constante `MEMBER_COUNT` com o número real
de membros do grupo (ex: `"12.500"`) para o selo de prova social aparecer ao lado
do botão no hero. Deixe em branco (`""`) para manter o selo oculto — evite números
inventados, isso quebra a confiança de quem visita a página.

## Como ajustar o contador de "próxima leva de cupons"

Em [script.js](script.js), ajuste `NEXT_DROP_HOUR` e `NEXT_DROP_MINUTE` (formato
24h) para o horário real em que vocês soltam cupons novos no grupo. O contador na
hero sempre mostra o tempo até esse horário (hoje, ou amanhã se já passou). Use um
horário que vocês realmente cumprem — um contador que não bate com a realidade
derruba a confiança de quem entrar no grupo esperando a promoção naquele horário.

## Como trocar o avatar do grupo

O hero usa [avatar.jpg](avatar.jpg) (arte oficial "Pokémon Day 2025" da Nintendo/Game
Freak/Creatures) como foto do grupo — **atenção**: é uma imagem com direitos autorais
de terceiros, usada aqui a pedido explícito e ciente do risco de notificação de
remoção/direitos autorais, já que o site se declara não afiliado a essas empresas.
Pra trocar por outra imagem, basta substituir o arquivo `avatar.jpg` (mantenha o
mesmo nome) ou editar o `src` da tag `<img>` dentro de `.avatar` em [index.html](index.html).

## Rodar localmente

Não precisa de instalação nem build. Basta abrir `index.html` no navegador,
ou usar qualquer servidor estático, por exemplo:

```bash
npx serve .
```

## Deploy na Vercel (grátis)

1. Suba esta pasta para um repositório no GitHub.
2. Acesse [vercel.com/new](https://vercel.com/new) logado com a mesma conta
   usada nos outros projetos.
3. Importe o repositório. A Vercel detecta automaticamente que é um site
   estático — não precisa configurar build command nem output directory.
4. Clique em Deploy. Pronto, o site fica em `https://<nome-do-projeto>.vercel.app`.

## Aviso

Site não afiliado à Pokémon Company, Nintendo, Game Freak ou Creatures Inc.
Apenas promove um grupo de avisos de promoções de terceiros.
