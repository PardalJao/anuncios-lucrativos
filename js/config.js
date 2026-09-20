/* ============================================================
   CONFIG — único lugar para editar preço, checkout e escassez.
   Tudo marcado com TODO ainda não foi definido pelo cliente.
   ============================================================ */

window.SITE_CONFIG = {
  // `null` em precoAVista esconde todo o bloco de preço.
  precoAVista: "R$ 47,90",
  precoParcelado: null,        // ex.: "12x de R$ 4,79"
  precoDe: null,               // preço riscado (ancoragem), ex.: "R$ 197"

  // TODO: colar o link do checkout (Hotmart / Kiwify / Stripe / etc.)
  // Enquanto for null, o botão da oferta fica desabilitado com `ctaTextoSemLink`.
  checkoutUrl: null,

  ctaTexto: "Garantir minha vaga",
  ctaTextoSemLink: "Em breve",
  ctaSubtexto: "Acesso imediato · Garantia de 7 dias",

  // TODO: mecânica de escassez, ou `null` para não exibir.
  //   { tipo: "data",  valor: "2026-10-01T23:59:00-03:00" }  → contador
  //   { tipo: "vagas", valor: 200 }                          → texto fixo
  escassez: null,
};
