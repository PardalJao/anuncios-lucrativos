/* ============================================================
   Anúncios Lucrativos — versão escura
   Sem biblioteca: IntersectionObserver + CSS fazem tudo.
   ============================================================ */
(() => {
  'use strict';

  const CFG = window.SITE_CONFIG || {};
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const telefone = () => innerWidth <= 700;

  /* ── 1. Config: preço, checkout, textos dos CTAs ─────────── */
  function aplicaConfig() {
    const temLink = typeof CFG.checkoutUrl === 'string' && CFG.checkoutUrl.length > 0;

    document.querySelectorAll('[data-cta]').forEach((btn) => {
      const doCheckout = btn.hasAttribute('data-checkout');
      if (doCheckout && !temLink) {
        // Sem link ainda: um botão de verdade, desabilitado — não um <a> morto.
        const morto = document.createElement('button');
        morto.type = 'button';
        morto.disabled = true;
        morto.className = btn.className;
        morto.textContent = CFG.ctaTextoSemLink || 'Em breve';
        btn.replaceWith(morto);
        return;
      }
      btn.textContent = CFG.ctaTexto || 'Garantir minha vaga';
      if (doCheckout) { btn.href = CFG.checkoutUrl; btn.rel = 'noopener'; }
    });

    document.querySelectorAll('[data-cta-sub]').forEach((el) => {
      if (CFG.ctaSubtexto) el.textContent = CFG.ctaSubtexto;
    });

    const valor = document.querySelector('[data-preco-valor]');
    const caixa = document.querySelector('[data-preco]');
    const barra = document.querySelector('[data-preco-barra]');
    if (!CFG.precoAVista) {
      caixa && caixa.remove();
      barra && barra.remove();
    } else {
      valor && (valor.textContent = CFG.precoAVista);
      barra && (barra.textContent = CFG.precoAVista);
    }
    const de = document.querySelector('[data-preco-de]');
    if (de && CFG.precoDe) { de.textContent = CFG.precoDe; de.hidden = false; }
    const parc = document.querySelector('[data-preco-parc]');
    if (parc && CFG.precoParcelado) { parc.textContent = 'ou ' + CFG.precoParcelado; parc.hidden = false; }
  }

  /* ── 2. Revelação ao rolar ───────────────────────────────── */
  function revela() {
    const els = document.querySelectorAll('[data-r]');
    if (reduzido || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    // irmãos que entram juntos ganham um degrau de atraso cada
    const io = new IntersectionObserver((entradas) => {
      let n = 0;
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.style.setProperty('--d', (n++ * 0.08).toFixed(2) + 's');
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((el) => io.observe(el));
  }

  /* ── 3. Palavras que acendem com a rolagem ───────────────── */
  function palavras() {
    const blocos = [...document.querySelectorAll('[data-palavras]')];
    if (!blocos.length) return;
    const dados = blocos.map((bloco) => {
      const txt = bloco.textContent.trim();
      // o leitor de tela lê a frase inteira; as palavras soltas são só pintura
      bloco.innerHTML = `<span class="sr">${txt}</span><span aria-hidden="true">` +
        txt.split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ') + '</span>';
      return { bloco, ws: [...bloco.querySelectorAll('.w')] };
    });
    if (reduzido) return;

    let pedido = false;
    const pinta = () => {
      pedido = false;
      const h = innerHeight;
      dados.forEach(({ bloco, ws }) => {
        const r = bloco.getBoundingClientRect();
        // começa quando o topo cruza 85% da tela, termina quando cruza 35%
        const p = Math.min(1, Math.max(0, (h * 0.85 - r.top) / (h * 0.5)));
        const acesas = Math.round(p * ws.length);
        ws.forEach((w, i) => w.classList.toggle('is-on', i < acesas));
      });
    };
    addEventListener('scroll', () => { if (!pedido) { pedido = true; requestAnimationFrame(pinta); } }, { passive: true });
    addEventListener('resize', pinta);
    pinta();
  }

  /* ── 4. Contadores ───────────────────────────────────────── */
  function contadores() {
    const els = document.querySelectorAll('[data-conta]');
    if (reduzido || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target;
        const alvo = +el.dataset.conta;
        const pre = el.dataset.pre || '';
        const t0 = performance.now();
        const dur = 1400;
        const passo = (t) => {
          const k = Math.min(1, (t - t0) / dur);
          const v = Math.round(alvo * (1 - Math.pow(1 - k, 3)));
          el.textContent = pre + v;
          if (k < 1) requestAnimationFrame(passo);
        };
        el.textContent = pre + '0';
        requestAnimationFrame(passo);
      });
    }, { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  /* ── 5. Mural de resultados em colunas que rolam ─────────── */
  function mural() {
    const mural = document.querySelector('[data-mural]');
    if (!mural || reduzido) return;
    const itens = [...mural.children];
    let colsAtual = 0;

    const monta = () => {
      const cols = telefone() ? 2 : innerWidth <= 1024 ? 3 : 4;
      if (cols === colsAtual) return;
      colsAtual = cols;
      const grupos = Array.from({ length: cols }, () => []);
      itens.forEach((it, i) => grupos[i % cols].push(it));
      mural.textContent = '';
      mural.classList.add('is-colunas');
      grupos.forEach((g, i) => {
        const col = document.createElement('div');
        col.className = 'mural__col';
        const trilho = document.createElement('div');
        trilho.className = 'mural__trilho';
        // a segunda volta é cópia decorativa: some do leitor de tela
        g.forEach((it) => trilho.appendChild(it));
        g.forEach((it) => {
          const c = it.cloneNode(true);
          c.setAttribute('aria-hidden', 'true');
          c.querySelector('img').alt = '';
          trilho.appendChild(c);
        });
        trilho.style.setProperty('--dur', (cols === 2 ? 46 : 58) + i * 9 + 's');
        col.appendChild(trilho);
        mural.appendChild(col);
      });
    };
    monta();
    let t;
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(monta, 200); });

    // fora da tela, para de gastar quadro
    new IntersectionObserver(([e]) => {
      mural.querySelectorAll('.mural__trilho').forEach((tr) => {
        tr.style.animationPlayState = e.isIntersecting ? '' : 'paused';
      });
    }).observe(mural);
  }

  /* ── 6. Matriz: casas que acendem em diagonal ────────────── */
  function matriz() {
    const grade = document.querySelector('[data-matriz]');
    if (!grade) return;
    const N = 8;
    for (let i = 0; i < N * N; i++) grade.appendChild(document.createElement('i'));
    const casas = [...grade.children];
    // um "caminho" de decisões: de baixo-esquerda para cima-direita
    const caminho = [56, 49, 50, 42, 43, 35, 28, 29, 21, 22, 14, 7];
    const vizinhos = new Set([57, 48, 41, 51, 34, 36, 27, 20, 30, 13, 15, 6]);
    vizinhos.forEach((i) => casas[i].classList.add('is-meio'));
    if (reduzido) { caminho.forEach((i) => casas[i].classList.add('is-on')); return; }

    let k = 0, rodando = null;
    const tique = () => {
      casas.forEach((c) => c.classList.remove('is-on'));
      caminho.slice(0, k + 1).forEach((i) => casas[i].classList.add('is-on'));
      k = (k + 1) % (caminho.length + 4);
    };
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !rodando) rodando = setInterval(tique, 260);
      if (!e.isIntersecting && rodando) { clearInterval(rodando); rodando = null; }
    }).observe(grade);
  }

  /* ── 7. Brilho que segue o mouse nos cards ───────────────── */
  function brilho() {
    if (!matchMedia('(hover: hover)').matches) return;
    document.querySelectorAll('.card').forEach((c) => {
      c.addEventListener('pointermove', (ev) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', ev.clientX - r.left + 'px');
        c.style.setProperty('--my', ev.clientY - r.top + 'px');
      });
    });
  }

  /* ── 8. Vídeo da bio: só carrega e toca quando aparece ───── */
  function video() {
    const v = document.querySelector('.bio__video video');
    if (!v) return;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!v.src) { v.src = telefone() ? v.dataset.srcSm : v.dataset.src; }
        if (!reduzido) v.play().catch(() => {});
      } else if (!v.paused) v.pause();
    }, { rootMargin: '200px 0px' }).observe(v);
  }

  /* ── 9. Cabeçalho sólido, menu ativo e barra do telefone ─── */
  function navegacao() {
    const topo = document.querySelector('[data-topo]');
    const solido = () => topo.classList.toggle('is-solido', scrollY > 24);
    addEventListener('scroll', solido, { passive: true });
    solido();

    const links = [...document.querySelectorAll('.menu a')];
    const alvos = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const ioMenu = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('is-ativo', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    alvos.forEach((s) => ioMenu.observe(s));

    // a barra some onde já existe um CTA grande na tela: hero, oferta e rodapé
    const barra = document.querySelector('[data-barra]');
    if (!barra) return;
    const estado = { hero: true, oferta: false, rodape: false };
    const sync = () => barra.classList.toggle('is-on', !estado.hero && !estado.oferta && !estado.rodape);
    const vigia = (sel, chave, margem) => {
      const el = document.querySelector(sel);
      if (!el) return;
      new IntersectionObserver(([e]) => { estado[chave] = e.isIntersecting; sync(); }, { rootMargin: margem }).observe(el);
    };
    vigia('.hero__acao', 'hero', '0px');
    vigia('#oferta', 'oferta', '0px');
    vigia('[data-rodape]', 'rodape', '0px 0px 120px 0px');
  }

  const inicia = () => {
    aplicaConfig();
    palavras();
    matriz();
    revela();
    contadores();
    mural();
    brilho();
    video();
    navegacao();
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', inicia) : inicia();
})();
