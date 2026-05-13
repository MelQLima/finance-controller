/**
 * Altura aproximada da BottomNav flutuante + folga, além do `insets.bottom`
 * (indicador home / gesto). Usado em scroll para o último conteúdo não ficar atrás da barra.
 */
export const FLOATING_BOTTOM_NAV_EXTRA = 120;

export function bottomScrollPaddingWithFloatingNav(insetsBottom: number, baseGap = 24) {
  return baseGap + insetsBottom + FLOATING_BOTTOM_NAV_EXTRA;
}
