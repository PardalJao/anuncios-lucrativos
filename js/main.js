/* ═══════════════════════════════════════════════════════════
   Programa Anúncios Lucrativos — V3
   Motor de efeitos herdado da V1, sobre o visual da V2.
   GSAP 3.12 + ScrollTrigger.
   ═══════════════════════════════════════════════════════════ */

document.documentElement.classList.add('js');

const CFG = window.SITE_CONFIG || {};
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = window.matchMedia('(min-width: 880px)').matches;

/* ───────────────────────────────────────────────────────────
   1. CONFIG → DOM
   ─────────────────────────────────────────────────────────── */
function applyConfig() {
  const hasLink = typeof CFG.checkoutUrl === 'string' && CFG.checkoutUrl.length > 0;

  document.querySelectorAll('[data-cta]').forEach((btn) => {
    const inOffer = !!btn.closest('.oferta__card');
    // SVG, nunca um glifo: ↗ tem variante emoji e o iOS pinta colorido
    const icon = '<span class="btn__icon" aria-hidden="true"><svg class="ico" aria-hidden="true"><use href="#i-ne"/></svg></span>';

    if (inOffer && !hasLink) {
      btn.innerHTML = (CFG.ctaTextoSemLink || 'Em breve') + icon;
      btn.setAttribute('aria-disabled', 'true');
      btn.removeAttribute('href');
      return;
    }

    btn.innerHTML = (CFG.ctaTexto || 'Garantir minha vaga') + icon;
    btn.href = inOffer ? CFG.checkoutUrl : '#oferta';
    if (inOffer) btn.rel = 'noopener';
    btn.removeAttribute('aria-disabled');
  });

  document.querySelectorAll('[data-cta-note]').forEach((n) => {
    n.textContent = CFG.ctaSubtexto || '';
  });

  const precoEl = document.querySelector('[data-preco]');
  if (precoEl && (CFG.precoAVista || CFG.precoParcelado)) {
    const main = CFG.precoParcelado || CFG.precoAVista;
    const sub = CFG.precoParcelado && CFG.precoAVista ? `ou ${CFG.precoAVista} à vista` : '';
    precoEl.innerHTML =
      (CFG.precoDe ? `<span class="preco__de">${CFG.precoDe}</span>` : '') +
      `<span class="preco__main">${main}</span>` +
      (sub ? `<span class="preco__sub">${sub}</span>` : '');
    precoEl.hidden = false;
  }

  const escEl = document.querySelector('[data-escassez]');
  if (escEl && CFG.escassez) {
    if (CFG.escassez.tipo === 'vagas') {
      escEl.textContent = `Apenas ${CFG.escassez.valor} vagas nesta condição`;
      escEl.hidden = false;
    } else if (CFG.escassez.tipo === 'data') {
      startCountdown(escEl, new Date(CFG.escassez.valor));
      escEl.hidden = false;
    }
  }

  const stickyPrice = document.querySelector('[data-sticky-price]');
  if (stickyPrice && (CFG.precoParcelado || CFG.precoAVista)) {
    stickyPrice.innerHTML = `${CFG.precoParcelado || CFG.precoAVista}<small>Garantia de 7 dias</small>`;
  }

  const fabPrice = document.querySelector('[data-fab-price]');
  if (fabPrice) {
    fabPrice.textContent = CFG.precoAVista
      ? `${CFG.precoAVista} · 7 dias de garantia`
      : '7 dias de garantia';
  }

  const ano = document.querySelector('[data-ano]');
  if (ano) ano.textContent = new Date().getFullYear();
}

function startCountdown(el, target) {
  const tick = () => {
    const ms = target - Date.now();
    if (ms <= 0) { el.textContent = 'Inscrições encerradas'; return; }
    const d = Math.floor(ms / 864e5);
    const h = Math.floor((ms % 864e5) / 36e5);
    const m = Math.floor((ms % 36e5) / 6e4);
    el.textContent = `Encerra em ${d}d ${h}h ${m}m`;
    setTimeout(tick, 30000);
  };
  tick();
}

/* ───────────────────────────────────────────────────────────
   2. VÍDEO DO HERO
   ─────────────────────────────────────────────────────────── */
function initHeroVideo() {
  const v = document.querySelector('.hero__video');
  if (!v) return;

  const saveData = navigator.connection && navigator.connection.saveData;
  if (reduced || saveData) return; // fica só no poster

  v.src = isDesktop ? v.dataset.src : (v.dataset.srcSm || v.dataset.src);
  v.load();
  v.addEventListener('loadeddata', () => v.classList.add('is-ready'), { once: true });
  v.play().catch(() => {});

  new IntersectionObserver(
    ([e]) => { e.isIntersecting ? v.play().catch(() => {}) : v.pause(); },
    { threshold: 0.05 }
  ).observe(v);
}

/* Vídeos em loop: só carregam quando chegam perto da tela e pausam ao
   sair — são decorativos e não valem banda antes da hora. Com movimento
   reduzido ficam no poster, que já é o primeiro quadro.
   O observador continua vivo depois de carregar: é ele que pausa o vídeo
   quando sai de cena, e um `unobserve` deixaria todos tocando à toa. */
function initVideosApoio() {
  document.querySelectorAll('.v-loop').forEach((v) => {
    if (reduced) return;
    const fonte = isDesktop ? v.dataset.src : (v.dataset.srcSm || v.dataset.src);
    new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) { v.pause(); return; }
      if (!v.src) {
        v.src = fonte;
        v.load();
        v.addEventListener('loadeddata', () => v.classList.add('is-ready'), { once: true });
      }
      v.play().catch(() => {});
    }, { rootMargin: '250px' }).observe(v);
  });
}

/* ───────────────────────────────────────────────────────────
   4. ROLLING TEXT
   Cada caractere numa caixa overflow:hidden com duas cópias
   empilhadas. O CSS sobe a pilha no hover, escalonado pelo
   --char-index. O texto visual é aria-hidden e o nome acessível
   vai no aria-label, senão o leitor anunciaria letra por letra.
   ─────────────────────────────────────────────────────────── */
function rollify(el) {
  const icon = el.querySelector('.btn__icon');
  const text = [...el.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.nodeValue)
    .join('')
    .trim();
  if (!text || el.querySelector('.rolling-text')) return;

  const roll = document.createElement('span');
  roll.className = 'rolling-text';
  roll.setAttribute('aria-hidden', 'true');

  [...text].forEach((ch, i) => {
    if (ch === ' ') {
      const sp = document.createElement('span');
      sp.className = 'rolling-char-space';
      roll.appendChild(sp);
      return;
    }
    const wrap = document.createElement('span');
    wrap.className = 'rolling-char-wrapper';
    wrap.style.setProperty('--char-index', i);

    const inner = document.createElement('span');
    inner.className = 'rolling-char-inner';

    const top = document.createElement('span');
    top.className = 'rolling-char-top';
    top.textContent = ch;

    const bottom = document.createElement('span');
    bottom.className = 'rolling-char-bottom';
    bottom.textContent = ch;

    inner.append(top, bottom);
    wrap.appendChild(inner);
    roll.appendChild(wrap);
  });

  if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', text);
  el.textContent = '';
  el.appendChild(roll);
  if (icon) el.appendChild(icon);
}

function initRollingText() {
  if (reduced) return;
  document.querySelectorAll('.btn, .nav__link').forEach(rollify);
}

/* ───────────────────────────────────────────────────────────
   5. REVELAÇÃO POR PALAVRA (gradiente recortado)
   O gradiente tem 330% da largura da palavra: animar
   background-position de 100% → 0% leva por transparente →
   flash no ouro → cor final.
   ─────────────────────────────────────────────────────────── */
function splitWords(el) {
  if (el.dataset.split === '1') return [];
  const out = [];
  // percorre só nós de texto: preserva <em>, <br>, <strong>
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let n;
  while ((n = walker.nextNode())) if (n.nodeValue.trim()) textNodes.push(n);

  textNodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    node.nodeValue.split(/(\s+)/).forEach((tok) => {
      if (!tok) return;
      if (!tok.trim()) { frag.appendChild(document.createTextNode(tok)); return; }
      const w = document.createElement('span');
      w.className = 'title-word';
      w.textContent = tok;
      frag.appendChild(w);
      out.push(w);
    });
    node.parentNode.replaceChild(frag, node);
  });

  el.dataset.split = '1';
  return out;
}

function initWordReveal() {
  if (reduced) return;
  document.querySelectorAll('.sec__title, .oferta__title, .manifesto__big, .garantia__texto h3')
    .forEach((el) => {
      const words = splitWords(el);
      if (!words.length) return;
      gsap.to(words, {
        backgroundPosition: '0% 0%',
        duration: 1.1,
        ease: 'power2.out',
        stagger: 0.045,
        scrollTrigger: { trigger: el, start: 'top 84%', once: true },
        onComplete: () => words.forEach((w) => w.classList.add('is-shown')),
      });
    });
}

/* ───────────────────────────────────────────────────────────
   6. PRELOADER
   Sobe até 90% no ritmo do carregamento real e só fecha quando
   fontes + window.load terminarem. Piso para não piscar, teto
   para nunca travar a página se um asset falhar.
   ─────────────────────────────────────────────────────────── */
const PALAVRAS = ['Atenção', 'Hooks', 'Ângulos', 'Formatos', 'Anúncios Lucrativos'];

function initPreloader(onDone) {
  const el = document.querySelector('[data-preloader]');
  if (!el || reduced) { document.documentElement.classList.remove('is-loading'); onDone(); return; }

  document.documentElement.classList.add('is-loading');

  const pctEl = el.querySelector('[data-pre-pct]');
  const barEl = el.querySelector('[data-pre-bar]');
  const wordEl = el.querySelector('[data-pre-word]');
  const marca = el.querySelector('[data-pre-mark]');

  const START = performance.now();
  const MIN_MS = 1500;
  const MAX_MS = 6000;
  let pct = 0;
  let ready = false;
  let finished = false;

  let wi = 0;
  const cycle = setInterval(() => {
    wi = (wi + 1) % PALAVRAS.length;
    const span = wordEl.querySelector('span');
    if (typeof gsap !== 'undefined') {
      gsap.to(span, {
        yPercent: -110, opacity: 0, duration: 0.34, ease: 'power2.in',
        onComplete: () => {
          span.textContent = PALAVRAS[wi];
          gsap.fromTo(span, { yPercent: 110, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
        },
      });
    } else {
      span.textContent = PALAVRAS[wi];
    }
  }, 700);

  Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise((r) => window.addEventListener('load', r, { once: true })),
  ]).then(() => { ready = true; });

  const tick = () => {
    if (finished) return;
    const elapsed = performance.now() - START;
    const done = (ready && elapsed >= MIN_MS) || elapsed >= MAX_MS;
    const target = done ? 100 : Math.min(90, (elapsed / MIN_MS) * 90);
    pct += (target - pct) * 0.12;
    if (done && target - pct < 0.5) pct = 100;

    const shown = Math.round(pct);
    pctEl.textContent = shown + '%';
    barEl.style.width = shown + '%';
    // o cifrão enche na mesma medida do número, de baixo para cima
    if (marca) marca.style.setProperty('--nivel', shown + '%');

    if (pct >= 100) {
      finished = true;
      clearInterval(cycle);
      // o cifrão está cheio: o nome abre ao lado e fecha o lockup.
      // A página só se revela depois que a logo terminou de se formar.
      // Quanto o conjunto precisa deslizar para que o lockup inteiro,
      // e não só o cifrão, fique no centro. Medido agora porque depende
      // da largura real do nome depois do clamp e das fontes; o recuo
      // de escala entra na conta porque encolhe em torno do cifrão.
      const REDUZ = 0.8;
      const nome = el.querySelector('.marca__nome');
      if (marca && nome) {
        // Por offset, não por getBoundingClientRect: o nome parte com um
        // translateX de entrada, e o rect já traria esse deslocamento
        // embutido, jogando o centro alguns pixels para o lado.
        const recuo = parseFloat(getComputedStyle(nome).marginLeft) || 0;
        const cresce = nome.offsetWidth + recuo;   // o que o nome soma à direita
        marca.style.setProperty('--reduz', REDUZ);
        marca.style.setProperty('--desloca',
          (-(cresce / 2) * REDUZ).toFixed(1) + 'px');
      }
      el.classList.add('is-completo');
      setTimeout(exit, reduced ? 0 : 1500);
      return;
    }
    requestAnimationFrame(tick);
  };

  const exit = () => {
    document.documentElement.classList.remove('is-loading');
    if (typeof gsap === 'undefined') { el.remove(); onDone(); return; }
    gsap.timeline({ onComplete: () => { el.remove(); onDone(); } })
      .to(el, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' });
  };

  requestAnimationFrame(tick);
}

/* ───────────────────────────────────────────────────────────
   7. NAV — indicador deslizante, seção ativa, menu mobile
   ─────────────────────────────────────────────────────────── */
function initNav() {
  const pill = document.querySelector('[data-navpill]');
  const ind = document.querySelector('[data-navindicator]');
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-menu-toggle]');

  if (toggle && pill) {
    toggle.addEventListener('click', () => {
      const open = pill.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });
    pill.addEventListener('click', (e) => {
      if (e.target.closest('.nav__item')) {
        pill.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (!pill || !ind) return;

  const items = [...pill.querySelectorAll('.nav__item')];
  const secoes = items
    .map((it) => ({ it, el: document.querySelector(it.getAttribute('href')) }))
    .filter((o) => o.el);

  const moveTo = (item) => {
    if (!item) { ind.style.opacity = '0'; return; }
    ind.style.opacity = '1';
    ind.style.left = item.offsetLeft + 'px';
    ind.style.width = item.offsetWidth + 'px';
  };

  let ativo = null;
  const setAtivo = (item) => {
    if (item === ativo) return;
    ativo = item;
    items.forEach((i) => i.classList.toggle('is-active', i === item));
    // o losango expande e muda a largura do item: medir no mesmo frame
    // pegaria o valor antigo
    requestAnimationFrame(() => requestAnimationFrame(() => moveTo(item)));
  };

  items.forEach((it) => it.addEventListener('pointerenter', () => moveTo(it)));
  pill.addEventListener('pointerleave', () => moveTo(ativo));

  const sync = () => {
    const linha = window.scrollY + window.innerHeight * 0.35;
    let atual = null;
    secoes.forEach(({ it, el }) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (linha >= top) atual = it;
    });
    setAtivo(atual);
  };

  window.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', () => moveTo(ativo), { passive: true });
  sync();
}

/* ───────────────────────────────────────────────────────────
   7b. CABEÇALHO — grudado / ilha flutuante / escondido
   Três estados, nesta ordem:
     scroll 0         → grudado no topo, largura total
     descendo         → desprende, encolhe e sai de cena; o CTA do
                        canto inferior direito assume
     subindo          → volta como ilha flutuante compacta
   Só reencosta no topo em largura total quando o scroll chega a 0.
   ─────────────────────────────────────────────────────────── */
function initHeaderScroll() {
  const header = document.querySelector('[data-header]');
  const fab = document.querySelector('[data-fab]');
  if (!header) return;

  // o CTA do canto se cala onde já existe outro botão de compra em cena.
  // Cada zona entra e sai por conta própria: uma variável só faria a
  // segunda a sair apagar o estado da primeira, que ainda está em cena.
  const zonas = new Set();

  // O rodapé revelado é `position:fixed` e fica atrás do conteúdo, então
  // está na viewport desde o topo da página. Observar interseção nele dava
  // "em cena" o tempo todo e o CTA do canto nunca aparecia. Com o rodapé
  // fixo o que marca a presença dele é ter chegado ao fim do rolar, que é
  // quando o espaçador do `body::after` termina de descobri-lo. No mobile
  // ele volta ao fluxo e aí a geometria normal vale de novo.
  const rodape = document.querySelector('.footer');
  let rodapeFixo = false;
  let rodapeAlt = 0;
  const medirZonaRodape = () => {
    if (!rodape) return;
    rodapeFixo = getComputedStyle(rodape).position === 'fixed';
    rodapeAlt = rodape.offsetHeight;
  };
  medirZonaRodape();
  window.addEventListener('resize', medirZonaRodape);

  const noRodape = () => {
    if (!rodape) return false;
    if (!rodapeFixo) {
      const r = rodape.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    }
    const fim = document.documentElement.scrollHeight - window.innerHeight;
    return (fim - window.scrollY) <= rodapeAlt * 0.75;
  };

  const emZonaDeCta = () => zonas.size > 0 || noRodape();

  ['#oferta'].forEach((sel) => {
    const alvo = document.querySelector(sel);
    if (!alvo) return;
    new IntersectionObserver(([e]) => {
      e.isIntersecting ? zonas.add(sel) : zonas.delete(sel);
      if (fab && emZonaDeCta()) fab.classList.remove('is-on');
    }, { threshold: 0 }).observe(alvo);
  });

  // No telefone o cabeçalho é só marca e CTA. Enquanto o botão da hero
  // está em cena os dois pedem a mesma coisa lado a lado, então o do
  // cabeçalho se recolhe — a partir da segunda dobra ele passa a ser a
  // única compra à mão e volta. É a mesma regra do CTA do canto, que já
  // se cala onde existe outro botão de compra visível.
  const ctaHero = document.querySelector('.hero__cta');
  if (ctaHero) {
    new IntersectionObserver(([e]) => {
      header.classList.toggle('is-cta-redundante', e.isIntersecting);
    }, { threshold: 0 }).observe(ctaHero);
  }

  // Sem CTA ao lado, a marca vai para o meio. O deslocamento é medido e
  // não fixo: o CTA recolhido continua ocupando espaço, e a largura útil
  // muda quando o cabeçalho desgruda do topo. Um ResizeObserver na barra
  // cobre os dois casos mais a chegada das fontes, que reflui a marca.
  // O transform não altera layout, então medir aqui não realimenta.
  const marca = header.querySelector('.brand');
  const barra = header.querySelector('.nav');
  if (marca && barra) {
    const medirCentroDaMarca = () => {
      const cs = getComputedStyle(barra);
      const util = barra.clientWidth
        - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const d = Math.max(0, (util - marca.offsetWidth) / 2);
      header.style.setProperty('--marca-centro', d.toFixed(1) + 'px');
    };
    medirCentroDaMarca();
    new ResizeObserver(medirCentroDaMarca).observe(barra);
    if (document.fonts) document.fonts.ready.then(medirCentroDaMarca);
  }

  const TOPO = 6;        // tolerância para "está no topo"
  const SOLTA = 90;      // a partir daqui pode esconder
  const RUIDO = 6;       // ignora tremidas de trackpad

  let ultimo = window.scrollY;
  let escondido = false;
  let agendado = false;

  // A barra de compra do rodapé é o reverso do cabeçalho: um entra
  // quando o outro sai. Em vez de duplicar a leitura de direção lá,
  // o cabeçalho anuncia a própria troca e quem quiser escuta.
  const avisar = () => document.dispatchEvent(
    new CustomEvent('cabecalho:escondido', { detail: { escondido } }));

  const aplicar = () => {
    agendado = false;
    const y = window.scrollY;
    const delta = y - ultimo;
    const menu = header.querySelector('.nav__pill.is-open');

    if (y <= TOPO) {
      // encostou no topo: volta a ser barra de largura total
      header.classList.remove('is-detached', 'is-hidden');
      if (escondido) { escondido = false; avisar(); }
    } else {
      header.classList.add('is-detached');

      if (Math.abs(delta) > RUIDO && !menu) {
        const descendo = delta > 0;
        const novo = descendo && y > SOLTA;
        if (novo !== escondido) {
          escondido = novo;
          header.classList.toggle('is-hidden', escondido);
          avisar();
        }
      }
    }

    if (fab) fab.classList.toggle('is-on', escondido && !emZonaDeCta());
    ultimo = y;
  };

  window.addEventListener('scroll', () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(aplicar);
  }, { passive: true });

  aplicar();
}

/* ───────────────────────────────────────────────────────────
   8. MARQUEE
   ─────────────────────────────────────────────────────────── */
function marquee(track, duration) {
  if (!track || track.dataset.marqueeOn === '1') return null;
  track.innerHTML += track.innerHTML;   // duplica para o loop fechar
  track.dataset.marqueeOn = '1';
  const loop = gsap.to(track, { xPercent: -50, duration, ease: 'none', repeat: -1 });
  const host = track.parentElement;
  host.addEventListener('pointerenter', () => gsap.to(loop, { timeScale: 0.2, duration: 0.6 }));
  host.addEventListener('pointerleave', () => gsap.to(loop, { timeScale: 1, duration: 0.6 }));
  ScrollTrigger.create({
    trigger: host, start: 'top bottom', end: 'bottom top',
    onToggle: (s) => (s.isActive ? loop.play() : loop.pause()),
  });
  return loop;
}

/* ───────────────────────────────────────────────────────────
   8b. PARALLAX
   [data-par="0.1"]       → move o próprio elemento
   [data-par-child="0.1"] → move o filho dentro de uma caixa que
                            recorta (.par-box), para a imagem ter
                            folga e não mostrar borda vazia
   ─────────────────────────────────────────────────────────── */
function initParallax() {
  gsap.utils.toArray('[data-par]').forEach((el) => {
    const amt = parseFloat(el.dataset.par) || 0.1;
    gsap.fromTo(el,
      { yPercent: -amt * 50 },
      {
        yPercent: amt * 50, ease: 'none',
        scrollTrigger: {
          trigger: el.closest('section') || el,
          start: 'top bottom', end: 'bottom top', scrub: true,
        },
      });
  });

  gsap.utils.toArray('[data-par-child]').forEach((box) => {
    const alvo = box.querySelector('img, video');
    if (!alvo) return;
    const amt = parseFloat(box.dataset.parChild) || 0.1;
    // a folga evita que a borda da imagem entre em cena no fim do curso
    gsap.set(alvo, { scale: 1 + amt });
    gsap.fromTo(alvo,
      { yPercent: -amt * 50 },
      {
        yPercent: amt * 50, ease: 'none',
        scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true },
      });
  });
}

/* ───────────────────────────────────────────────────────────
   8c. CAMADAS
   Cada seção marcada entra como uma folha por cima da anterior:
   sobe de baixo e, ao sair, desacelera e escurece um pouco, como
   se ficasse para trás. Só transform e opacity — nada de skew.
   ─────────────────────────────────────────────────────────── */
/* `100vw` conta a barra de rolagem, `100%` não. Quem sangra até a borda
   da viewport com `calc(50% - 50vw)` estoura exatamente a largura da
   barra e cria um scroll horizontal de alguns pixels. */
function medirBarra() {
  const sbw = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--sbw', sbw + 'px');
}

/* O curso que descobre o rodapé precisa ter a altura dele, senão sobra
   espaço vazio ou o rodapé nunca aparece inteiro. */
function medirRodape() {
  const f = document.querySelector('.footer');
  if (!f) return;
  document.documentElement.style.setProperty('--rodape', f.offsetHeight + 'px');
}

/* O empilhamento não depende de GSAP: sem z-index crescente a folha de
   baixo pintaria por cima da de cima e os cantos arredondados sumiriam. */
function stackLayers() {
  document.querySelectorAll('[data-layer]').forEach((sec, i) => {
    sec.style.zIndex = String(2 + i);
  });
}

function initLayers() {
  // Só as trocas que ganham com a transição. Empilhar tudo vira tique:
  // o olho passa a esperar o efeito e ele deixa de significar alguma coisa.
  const secoes = gsap.utils.toArray('[data-layer]');

  secoes.forEach((sec) => {
    // o pin embrulha a seção num spacer, então o vizinho no DOM pode ser
    // esse invólucro e não a seção em si
    let anterior = sec.previousElementSibling;
    if (anterior && anterior.classList.contains('pin-spacer')) {
      anterior = anterior.querySelector('section') || anterior;
    }
    if (!anterior) return;

    // Uma seção pinada já está sob controle do ScrollTrigger: empilhar um
    // yPercent por cima briga com o transform do pin e faz a seção tremer.
    const pinada = ScrollTrigger.getAll().some((t) => t.pin === anterior);

    if (!pinada) {
      // A folha que sai desliza mais devagar do que o scroll e a nova a
      // alcança: é a diferença de velocidade que lê como profundidade.
      // Prender no próprio `sec` (e não na anterior) mantém o par em fase.
      gsap.fromTo(anterior,
        { yPercent: 0 },
        {
          yPercent: -7, ease: 'none',
          scrollTrigger: {
            trigger: sec, start: 'top bottom', end: 'top top', scrub: true,
          },
        });
    }

    const véu = anterior.querySelector('[data-layer-veil]');
    if (!véu) return;
    gsap.fromTo(véu,
      { opacity: 0 },
      {
        opacity: 1, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub: true },
      });
  });
}

/* ───────────────────────────────────────────────────────────
   8d. ÓRBITA DOS REGISTROS
   O texto fica parado no centro e as peças se revelam em volta
   conforme a dobra atravessa a tela. Cada peça sai da direção
   em que está posicionada, como se viesse de fora do quadro.
   ─────────────────────────────────────────────────────────── */
function initOrbita() {
  const orb = document.querySelector('[data-orb]');
  const sec = document.querySelector('.orbita');
  if (!orb || !sec) return;

  // Ordem do anel no sentido horário, começando no topo à esquerda.
  // É por ela que cada peça sabe para onde viajar na virada.
  const ANEL = ['et1', 'et2', 'er1', 'er2', 'er3', 'er4',
                'eb2', 'eb1', 'el4', 'el3', 'el2', 'el1'];

  const chave = (el) => ANEL.find((k) => el.classList.contains('orb--' + k));

  // abaixo de 900px o CSS desmonta a órbita e vira grade: sem pin, sem viagem
  gsap.matchMedia().add('(min-width: 901px)', () => {
    const itens = gsap.utils.toArray('.orb__item', orb)
      .filter(chave)
      .sort((a, b) => ANEL.indexOf(chave(a)) - ANEL.indexOf(chave(b)));
    if (itens.length < 2) return;

    // A rotação de repouso mora no CSS de cada posição. O GSAP assume o
    // transform inteiro, então lê esse ângulo uma vez e passa a somá-lo.
    const base = itens.map((el) => {
      const m = getComputedStyle(el).transform;
      if (!m || m === 'none') return 0;
      const [a, b] = m.replace(/matrix\(|\)/g, '').split(',').map(parseFloat);
      return Math.atan2(b, a) * 180 / Math.PI;
    });

    // Mede os centros em repouso para descobrir o vetor até a peça seguinte.
    // Medir (em vez de chutar px) mantém o giro correto em qualquer largura.
    let plano = [];
    const medir = () => {
      gsap.set(itens, { clearProps: 'transform' });
      const centro = itens.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      plano = itens.map((el, i) => {
        const prox = centro[(i + 1) % itens.length];
        const meio = orb.getBoundingClientRect();
        const eu = centro[i];
        // entrada: vem de fora, na direção da borda mais próxima
        const fora = 1.35;
        return {
          dx: prox.x - eu.x,
          dy: prox.y - eu.y,
          fx: (eu.x - (meio.left + meio.width / 2)) * fora,
          fy: (eu.y - (meio.top + meio.height / 2)) * (fora * 0.55),
          giro: (i % 2 ? 1 : -1) * gsap.utils.random(6, 11, 0.5),
        };
      });
      itens.forEach((el, i) => gsap.set(el, { rotation: base[i] }));
    };
    medir();

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: () => '+=' + window.innerHeight * 2.2,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onRefreshInit: medir,
      },
    });

    // 1. ENTRADA (0 → .42): sai de fora do miolo e pousa no layout do CSS
    itens.forEach((el, i) => {
      tl.fromTo(el,
        { x: () => plano[i].fx, y: () => plano[i].fy, scale: 0.82, opacity: 0 },
        { x: 0, y: 0, scale: 1, opacity: 1, ease: 'power2.out', duration: 0.42 },
        i * 0.012);
    });

    // 2. REPOUSO (.42 → .52): o layout fica parado o suficiente para ser lido
    tl.to({}, { duration: 0.1 });

    // 3. VIRADA (.52 → 1): cada peça ocupa o lugar da seguinte e o anel gira
    //    um passo. O ângulo extra dá a sensação de peça solta, não de grade.
    itens.forEach((el, i) => {
      tl.to(el, {
        x: () => plano[i].dx,
        y: () => plano[i].dy,
        rotation: base[i] + plano[i].giro,
        ease: 'power2.inOut',
        duration: 0.48,
      }, 0.52 + i * 0.008);
    });

    return () => gsap.set(itens, { clearProps: 'transform,opacity' });
  });
}

/* ───────────────────────────────────────────────────────────
   10. MOTION — criado na ordem da página (top → bottom), como
   o ScrollTrigger recomenda: o refresh roda em ordem de criação
   e a ordem errada bagunça o espaçamento dos pins.
   ─────────────────────────────────────────────────────────── */
function initMotion() {
  if (reduced || typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const EASE = 'power3.out';

  /* ── 10.1 Hero ────────────────────────────────────────── */
  // o estado inicial do título nasce aqui, não no CSS: o GSAP lê um
  // transform de CSS como matriz em px e trata yPercent como eixo
  // separado que soma por cima — o deslocamento em px ficaria intacto
  gsap.set('.hero__title .line > span', { yPercent: 108 });
  gsap.set('.hero__title', { opacity: 1 });

  gsap.timeline({ defaults: { ease: EASE } })
    .to('.hero__title .line > span', { yPercent: 0, duration: 1.25, stagger: 0.1 }, 0.15)
    .to('.hero .pill', { opacity: 1, y: 0, duration: 0.7 }, 0.05)
    .to('.hero__lead', { opacity: 1, y: 0, duration: 0.85 }, 0.8)
    .to('.hero__cta', { opacity: 1, y: 0, duration: 0.75 }, 0.95)
    .to('.hero__note', { opacity: 1, y: 0, duration: 0.6 }, 1.1)
    .to('.showcase', { opacity: 1, y: 0, duration: 1.1 }, 1.0);

  gsap.to('.hero__media', {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  marquee(document.querySelector('[data-marquee]'), 38);

  /* ── 10.2 Reveals em lote ──────────────────────────────
     ScrollTrigger.batch agrupa os callbacks que disparam na mesma
     janela: uma tween com stagger em vez de uma por elemento. */
  // sem `overwrite`: vários alvos do reveal também têm parallax, e overwrite
  // mataria a tween de yPercent quando o lote entrasse na tela. `once: true`
  // já garante que cada elemento é animado uma vez só.
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    once: true,
    onEnter: (lote) => gsap.to(lote, {
      opacity: 1, y: 0, duration: 0.95, ease: EASE, stagger: 0.08,
    }),
  });

  gsap.utils.toArray('.reveal-stagger').forEach((grupo) => {
    gsap.to(grupo.children, {
      opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.07,
      scrollTrigger: { trigger: grupo, start: 'top 86%', once: true },
    });
  });

  /* ── 10.3 Agitação ────────────────────────────────────── */
  gsap.from('.agita__text .w', {
    opacity: 0, y: 26, duration: 1, ease: EASE, stagger: 0.14,
    scrollTrigger: { trigger: '.agita', start: 'top 76%', once: true },
  });
  gsap.from('.agita__saida', {
    opacity: 0, y: 30, duration: 1.1, ease: EASE,
    scrollTrigger: { trigger: '.agita__saida', start: 'top 88%', once: true },
  });

  /* ── 10.4 Pilares + contadores ─────────────────────────
     A mesma media query do CSS decide o modo:
       pinado → contadores com scrub, revelados um a um
       normal → disparam uma vez ao entrar na tela          */
  const countUp = (numEl) => {
    const alvo = +numEl.dataset.count;
    return { alvo, write: (v) => { numEl.textContent = Math.round(v); } };
  };

  gsap.matchMedia().add(
    {
      pinado: '(min-width: 980px) and (min-height: 760px)',
      normal: '(max-width: 979px), (max-height: 759px)',
    },
    (ctx) => {
      const pilares = gsap.utils.toArray('.pilar');
      const sec = document.querySelector('.pilares');
      if (!pilares.length || !sec) return;

      if (ctx.conditions.pinado) {
        sec.classList.add('is-pinned');
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sec, start: 'top top', end: '+=' + Math.round(window.innerHeight * 1.5),
            pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true,
          },
        });
        pilares.forEach((pilar, i) => {
          const c = countUp(pilar.querySelector('[data-count]'));
          const n = { v: 0 };
          const at = i * 0.3;
          tl.to(pilar, { opacity: 1, duration: 0.22, ease: 'power2.out' }, at)
            .to(n, { v: c.alvo, duration: 0.28, ease: 'power1.out', onUpdate: () => c.write(n.v) }, at);
        });
        tl.to({}, { duration: 0.18 }); // respiro antes do unpin
        return () => sec.classList.remove('is-pinned');
      }

      pilares.forEach((pilar, i) => {
        const c = countUp(pilar.querySelector('[data-count]'));
        const n = { v: 0 };
        gsap.to(n, {
          v: c.alvo, duration: 1.4, ease: 'power2.out', delay: i * 0.1,
          onUpdate: () => c.write(n.v),
          scrollTrigger: { trigger: pilar, start: 'top 86%', once: true },
        });
      });
    }
  );

  /* ── 10.5 Trilho horizontal dos entregáveis ────────────
     ease:"none" é obrigatório: com qualquer outra, a posição
     horizontal deixa de acompanhar o scroll 1:1.            */
  gsap.matchMedia().add('(min-width: 980px)', () => {
    const box = document.querySelector('[data-hscroll]');
    const track = document.querySelector('[data-htrack]');
    const sec = document.querySelector('.entregaveis');
    if (!box || !track || !sec) return;

    box.classList.add('is-pinned');
    // clientWidth inclui o padding lateral do trilho, mas o track começa
    // depois dele: sem descontar os dois lados, o curso fica curto e o
    // último cartão nunca alcança a borda
    const dist = () => {
      const cs = getComputedStyle(box);
      const visivel = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      return Math.max(0, track.scrollWidth - visivel);
    };
    // curso extra depois que o trilho acaba: segura o último cartão em
    // cena antes de devolver o scroll à página
    const SEGURA = () => window.innerHeight * 0.85;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sec, start: 'top top',
        end: () => '+=' + (dist() + SEGURA()),
        pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
      },
    });

    // as durações são proporções do curso total, por isso o corrimento
    // horizontal e a pausa precisam bater com a divisão do `end`
    tl.to(track, { x: () => -dist(), ease: 'none', duration: () => dist() || 1 })
      .to({}, { duration: SEGURA });

    return () => {
      box.classList.remove('is-pinned');
      tl.scrollTrigger?.kill();
      tl.kill();
      gsap.set(track, { x: 0 });
    };
  });

  /* ── 10.6 Cartões do trilho em cascata ─────────────────── */
  gsap.from('.trilho__track .card', {
    opacity: 0, y: 26, duration: 0.85, ease: EASE, stagger: 0.06,
    scrollTrigger: { trigger: '.entregaveis', start: 'top 78%', once: true },
  });

  initParallax();
  // a órbita cria o próprio pin; initLayers precisa vê-lo para não
  // empilhar yPercent numa seção pinada
  initOrbita();
  initLayers();
  initWordReveal();

  // fontes mudam a altura dos blocos e movem todos os gatilhos
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  ScrollTrigger.refresh();
}

/* ───────────────────────────────────────────────────────────
   11. BARRA FIXA
   ─────────────────────────────────────────────────────────── */
function initStickyBar() {
  const bar = document.querySelector('[data-sticky]');
  const oferta = document.querySelector('#oferta');
  const ctaHero = document.querySelector('.hero__cta');
  if (!bar) return;

  bar.hidden = false;

  // Os dois nunca dividem a tela: descendo, o cabeçalho sai e a barra
  // entra; subindo, a barra sai e o cabeçalho volta com o CTA. Na hero
  // a barra não aparece em nenhuma direção — o botão da própria dobra
  // já é o convite, e o cabeçalho volta sem CTA para não repetir.
  let naHero = !!ctaHero;
  let naOferta = false;
  let descendo = false;

  const sync = () => bar.classList.toggle(
    'is-on', descendo && !naHero && !naOferta);

  if (ctaHero) {
    new IntersectionObserver(([e]) => { naHero = e.isIntersecting; sync(); },
      { threshold: 0 }).observe(ctaHero);
  }

  // na oferta os botões da seção já estão em cena
  if (oferta) {
    new IntersectionObserver(([e]) => { naOferta = e.isIntersecting; sync(); },
      { threshold: 0 }).observe(oferta);
  }

  document.addEventListener('cabecalho:escondido', (e) => {
    descendo = e.detail.escondido;
    sync();
  });
}

/* ───────────────────────────────────────────────────────────
   12. FAQ — abre um, fecha os outros
   ─────────────────────────────────────────────────────────── */
function initFaq() {
  const all = document.querySelectorAll('.qa');
  all.forEach((qa) => {
    qa.addEventListener('toggle', () => {
      if (!qa.open) return;
      all.forEach((o) => { if (o !== qa) o.open = false; });
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
  });
}

/* ───────────────────────────────────────────────────────────
   BOOT
   ─────────────────────────────────────────────────────────── */
applyConfig();
medirBarra();
medirRodape();
window.addEventListener('resize', () => { medirBarra(); medirRodape(); }, { passive: true });
stackLayers();
initNav();
initHeaderScroll();
initHeroVideo();
initVideosApoio();
initStickyBar();
initFaq();
initRollingText();   // depois do applyConfig, que é quem escreve os rótulos

/* Failsafe: o CSS esconde os elementos animados pela classe `.js`. Se o GSAP
   não carregar (CDN bloqueada, offline), a página ficaria em branco. */
setTimeout(() => {
  if (typeof gsap === 'undefined') document.documentElement.classList.remove('js');
}, 2500);

// o preloader segura o motion: a animação do hero só começa quando ele sai
initPreloader(initMotion);
