# Programa Anúncios Lucrativos — V3

Terceira versão da landing page. HTML + CSS + JS puro, GSAP via CDN. Sem build.

**O que a V3 é:** a copy literal do PDF (como na V1) dentro do sistema visual da V2
(claro, editorial), movida pelo motor de efeitos da V1.

**Exceção de copy — o hero.** A headline e o lead são os da V2, não os do PDF:

> Copie o sistema de anúncios que já *venderam milhões.*
> Hooks vencedores, ângulos validados e formatos campeões para negócios locais,
> serviços, e-commerce e infoprodutos.

O PDF abre com o nome do produto ("Programa Anúncios Lucrativos") e joga a promessa para
o subtítulo. A versão da V2 sobe a promessa para a headline. Foi escolha do cliente,
ciente de que foge do literal. **Daqui para baixo, tudo volta a ser o PDF palavra por
palavra.**

```
site-v3/
├── index.html          # copy transcrita LITERAL do PDF
├── css/style.css
├── js/
│   ├── config.js       # ← preço, checkout e escassez ficam AQUI
│   └── main.js         # GSAP + ScrollTrigger
└── assets/
    ├── fonts/          # Sentient (serif) + DM Sans, locais
    ├── img/            # herdadas da V1, já otimizadas
    └── video/          # loops do hero e do retrato
```

## Vídeos

| Arquivo | Onde | Peso |
|---|---|---|
| `bruno-loop.mp4` | retrato do hero e foto do sobre (≥880px) | 343 KB |
| `bruno-loop-sm.mp4` | os mesmos, abaixo de 880px | 146 KB |
| `hero-loop.mp4` | textura de fundo do hero e "Na prática" | herdado da V1 |

Todos **sem trilha de áudio** — não é só `muted`, a faixa foi removida no
encode. O master do retrato fica em `assets/video/_orig/`.

Receita usada (ffmpeg 6, o binário vem com o `ffmpeg-static` da V1 em
`../site/node_modules/ffmpeg-static/ffmpeg`):

```bash
ffmpeg -i origem.mp4 -an -c:v libx264 -profile:v high -crf 28 \
  -preset slow -pix_fmt yuv420p -vf "scale=640:-2" -movflags +faststart saida.mp4
```

`-an` descarta o áudio; `+faststart` move o índice para o começo do arquivo,
então o vídeo toca antes de terminar de baixar. O de 2,2 MB virou 343 KB.

**Carregamento:** nenhum desses vídeos tem `autoplay`. A classe `.v-loop` os
deixa em `preload="none"` mostrando só o poster, e o `initVideosApoio()` atribui
o `src` quando o elemento chega a 250px da tela, escolhendo a versão pela
largura. O observador continua vivo depois de carregar — é ele que pausa o
vídeo ao sair de cena. Com `prefers-reduced-motion` nenhum chega a carregar e o
poster (que é o primeiro quadro) fica no lugar.

## Rodar local

```bash
cd site-v3 && python3 -m http.server 4323
```

## Publicar

O projeto da Vercel está conectado a este repositório. Não se usa mais
`vercel deploy` a partir da máquina — quem publica é o Git:

| O que você faz | O que acontece |
|---|---|
| `git push` na `main` | vai para produção em `anuncios-lucrativos.vercel.app` |
| `git push` em outra branch | gera um link de preview, produção não muda |

Para mexer sem risco, trabalhe numa branch e só junte na `main` quando o
preview estiver aprovado:

```bash
git checkout -b ajuste-do-preco
# edita, testa, commita
git push -u origin ajuste-do-preco     # sai um link de preview
```

Aprovado:

```bash
git checkout main && git merge ajuste-do-preco && git push
```

Se algo quebrar em produção, o painel da Vercel tem **Instant Rollback**, que
devolve o deploy anterior sem precisar de Git.

---

## De onde veio cada parte

| Camada | Origem | Observação |
|---|---|---|
| **Copy** | PDF (8 páginas) | Literal, palavra por palavra. Nenhuma frase reescrita. |
| **Visual** | V2 (`anuncios-lucrativos.vercel.app`) | Tokens, tipografia, cards, grades e seção escura. |
| **Efeitos** | V1 (`../site`) | Preloader, word reveal, rolling text, pin, trilho, marquee. |
| **Assets** | V1 | A V2 já usava os mesmos arquivos; nada foi reprocessado. |

### Tokens (medidos da V2, não estimados)

```
--paper #f7f4ee   --ink #15130f   --muted #6c655a
--green #7d6534   --champagne #b08d57   --deep #111111
--line #e3ddd1    --mint #efe7d7
Sentient (serif, 400) + DM Sans (sans)
```

O único token que a V3 acrescenta é `--e-house: cubic-bezier(.77,0,.18,1)`, o easing
da V1, usado no rolling text.

---

## Os efeitos herdados da V1

| Efeito | Onde | Como funciona |
|---|---|---|
| **Preloader** | entrada | Palavra em serif ciclando (Atenção → Hooks → Ângulos → Formatos → Anúncios Lucrativos), contador de % e barra. Acompanha carregamento real (`document.fonts.ready` + `window.load`), piso de 1,5s e teto de 6s. |
| **Entrada por máscara** | hero | Cada linha do título é uma caixa `overflow:hidden`; o texto sobe de baixo com stagger de 100ms. |
| **Cabeçalho em 3 estados** | topo | Ver seção própria abaixo. |
| **Parallax** | vitrine, retrato, foto do sobre, selo | `[data-par]` move o próprio elemento; `[data-par-child]` move a imagem dentro de uma caixa que recorta. |
| **Camadas** | todas as dobras | Cada seção é uma folha opaca com cantos superiores arredondados que sobe por cima da anterior; a de baixo recebe um véu que escurece enquanto é coberta. |
| **Ilustrações animadas** | 7 entregáveis | Um SVG por cartão desenhando o que o item faz. Só `transform` e `opacity`, em loop, acelerando no hover. |
| **Rolling text** | botões, nav | Cada caractere numa caixa `overflow:hidden` com duas cópias empilhadas; o hover sobe a pilha com atraso de 15ms × índice. |
| **Revelação por palavra** | todos os `h2` | Gradiente de 330% preso ao texto por `background-clip`. Animar `background-position` leva a palavra por transparente → flash no ouro → cor final. |
| **Indicador de nav** | header | Pílula deslizante que segue a seção no scroll e o cursor no hover. |
| **Marquee** | faixa de autoridade | Loop contínuo, desacelera no hover, pausa fora da tela. |
| **Pin + contadores** | pilares | Acima de 980×760 a seção é pinada e os três cartões entram um a um com os números em scrub. Abaixo disso, empilha e conta uma vez. |
| **Trilho horizontal** | entregáveis | Acima de 980px a seção é pinada e os 7 cartões correm de lado em scrub. Abaixo, `overflow-x` + `scroll-snap` nativo. |
| **Barra fixa** | mobile | Aparece depois do hero e some dentro da oferta. |

### Decisões de motion

O motor foi reescrito seguindo as recomendações oficiais do ScrollTrigger, e difere da
V1 em três pontos:

1. **`ScrollTrigger.batch()` para os reveals.** A V1 criava um ScrollTrigger por
   elemento com `.forEach()`. O batch agrupa os que entram na mesma janela e roda uma
   tween com stagger.
2. **ScrollTriggers criados na ordem da página.** O refresh roda em ordem de criação;
   fora de ordem, o espaçamento dos pins sai errado.
3. **`ScrollTrigger.refresh()` depois de `document.fonts.ready`.** As fontes mudam a
   altura dos blocos e movem todos os gatilhos.

### O cabeçalho e o CTA do canto

Três estados, nesta ordem:

| Estado | Quando | Como fica |
|---|---|---|
| **grudado** | `scrollY === 0` | Barra de largura total, 86px, sem cantos nem sombra. |
| **ilha** | qualquer scroll > 0, subindo | Desprende do topo (`top:12px`), encolhe para 64px, ganha cantos de 16px, borda e sombra. Largura vai a `min(1160px, 100% - 40px)`. |
| **escondido** | descendo, passados 90px | Sai por cima. O CTA flutuante do canto inferior direito assume, com o preço. |

Só volta ao estado **grudado** quando o scroll chega de fato a zero — nunca por
estar "quase" no topo.

Detalhes que importam:

- O scroll é lido num `requestAnimationFrame` com trava (`agendado`), não a cada
  evento. Scroll é um dos eventos mais ruidosos do browser.
- Um limiar de 6px ignora tremidas de trackpad, senão o cabeçalho pisca ao menor toque.
- Com o menu mobile aberto, o cabeçalho **não** se esconde — sumiria com o menu dentro.
- O CTA do canto só existe acima de 800px. No mobile quem faz esse papel é a barra fixa
  do rodapé, e os dois no mesmo canto brigariam.

### Inclinação por velocidade — testada e removida

Uma versão anterior usava `self.getVelocity()` para inclinar blocos inteiros
(`skewY`) conforme a rapidez do scroll. No papel é elegante; na tela dá um aspecto
de perspectiva torta, como se a seção tivesse saído do eixo. Foi retirada a pedido
do cliente e substituída pelo efeito de camadas, que sugere profundidade sem
deformar nada.

Se o assunto voltar: o caminho era `gsap.quickTo` num `skewY` com teto de 5°, zerado
em `onLeave`/`onLeaveBack`.

### O trilho segura no último cartão

O curso do pin é `dist() + 85vh`. A timeline gasta `dist()` movendo o trilho e os
85vh restantes num `to({}, {duration})` vazio — é essa pausa que mantém o cartão 07
em cena antes de o scroll voltar à página.

Duas contas que precisam bater:

1. **A distância desconta o padding lateral.** `box.clientWidth` inclui o padding do
   trilho, mas o track começa depois dele. Sem descontar os dois lados, o curso fica
   curto e o último cartão nunca alcança a borda — o sintoma é o scroll destravar com
   o cartão 07 ainda pela metade.
2. **As durações da timeline são proporções do curso.** Se mudar o `end`, mude as
   durações na mesma medida, senão a pausa encolhe ou engole o corrimento.

### O `fitTitle()` da V1 foi removido — e por quê

A V1 calculava um `letter-spacing` por linha para todas terminarem no mesmo pixel. Isso
só faz sentido quando cada linha tem **uma palavra só** ("ANÚNCIOS" / "LUCRATIVOS"), que
não tem espaço entre palavras para justificar.

A headline da V3 tem três linhas de larguras naturais crescentes, e é justamente esse
escalonamento que dá o ritmo. Igualar as larguras mataria o efeito. As linhas usam
`white-space: nowrap` para manter as quebras exatas — soltas abaixo de 600px, senão o
título estoura a viewport.

### Armadilhas que continuam valendo

- **`yPercent` do GSAP:** o estado inicial do título do hero nasce em `gsap.set()`, nunca
  no CSS. O GSAP lê um transform de CSS como matriz em px e trata `yPercent` como eixo
  separado que soma por cima — o deslocamento em px ficaria intacto.
- **`overflow:hidden` mata o pin:** `.sec` usa `overflow` para o marquee sangrar, então
  `.pilares` e `.entregaveis` recebem `overflow:visible` explicitamente.
- **Altura da caixa do rolling (`--roll-h: 1.5em`):** precisa caber o acento de `Ú`, `Â`
  e o cedilha em caixa alta. A 1.28em o acento encosta na borda.
- **Acessibilidade do rolling:** o texto visual vai com `aria-hidden` e o nome acessível
  fica no `aria-label` do botão, senão o leitor de tela anuncia letra por letra.
- **`text-wrap: balance` na agitação — não usar.** Ele equilibra cada frase isoladamente
  e as três acabam com medidas diferentes. Uma largura fixa em `ch` resolve.
- **`overwrite: true` no batch dos reveals mata o parallax.** Vários alvos têm `.reveal`
  e `[data-par]` ao mesmo tempo; quando o lote entrava na tela, o overwrite matava a
  tween de `yPercent` e o elemento congelava. O `once: true` já garante uma passada só,
  então o overwrite não fazia falta. Sintoma: parallax que funciona no topo da página e
  morre exatamente quando o elemento aparece.
- **`[stroke]` como seletor não pega SVG sem o atributo.** As ilustrações declaram traço
  e preenchimento no `<svg>` e deixam herdar. Estilizar por `[stroke]` não casa com nada
  e as formas caem no `fill` preto padrão — o sintoma é a ilustração aparecer como um
  bloco sólido escuro.
- **`50vw` conta a barra de rolagem, `50%` não.** Quem sangra até a borda com
  `calc(50% - 50vw)` estoura a página pela largura da barra. O JS mede e publica `--sbw`;
  o cálculo desconta metade dela de cada lado. Sintoma: alguns pixels de scroll
  horizontal que aparecem só no desktop, e só quando há barra visível.

### Ajustes só de mobile

- Abaixo de 600px o título solta o `nowrap` e cai para `clamp(32px,9vw,48px)`. Com as
  quebras fixas ele estouraria a viewport.
- O CTA do header some abaixo de 560px — não cabe ao lado da marca e do hambúrguer, e a
  barra fixa do rodapé já carrega a mesma ação.

---

## O que ainda falta (TODO)

### 1. Checkout — `js/config.js`
O preço já está preenchido: **R$ 47,90 à vista**. Falta o link:

```js
checkoutUrl: "https://pay.hotmart.com/...",
```

Enquanto for `null`, o botão da oferta fica desabilitado mostrando "Em breve". O preço
aparece em três lugares e todos leem do mesmo `config.js`: o card da oferta, o CTA
flutuante do canto e a barra fixa do mobile.

Opcionais, ainda vazios: `precoParcelado` (ex.: `"12x de R$ 4,79"`) e `precoDe`, o preço
riscado de ancoragem.

### 2. Escassez
Não definida. Em `config.js`, `escassez` aceita:
- `{ tipo: "data",  valor: "2026-10-01T23:59:00-03:00" }` → contador regressivo
- `{ tipo: "vagas", valor: 200 }` → texto fixo
- `null` → não exibe nada (estado atual)

### 3. Rodapé
Razão social, CNPJ, e-mail de suporte, Termos de Uso e Política de Privacidade.

### 4. Rastreamento
Sem pixel, sem GTM, sem analytics. Adicionar antes de subir.

### 5. Prints de resultado
Os 12 registros são conversas privadas com nomes, fotos de perfil e @ de pessoas reais
identificáveis. Vieram do PDF do próprio Bruno, então é decisão dele — mas vale confirmar
se todos autorizaram aparecer numa página pública.

### 6. `X-Robots-Tag: noindex`
O `vercel.json` veio da V1 com `noindex, nofollow`. Apropriado enquanto é rascunho;
**remover antes de lançar**.

---

## Furos da copy que NÃO foram corrigidos

São do PDF, e o pedido foi transcrição literal (exceto o hero, ver topo):

- "já venderam milhões" — sem número específico
- Sem ancoragem de valor por entregável
- "Garanta sua vaga hoje" sem prazo nem quantidade
- A copy nunca diz o nome do autor (só "quem vai te ensinar")
- Sem depoimento escrito com nome e rosto
