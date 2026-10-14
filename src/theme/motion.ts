/**
 * Movimento do Dr.Mouse — o ÚNICO lugar com duração, mola e atraso (RF-62).
 *
 * Nenhum componente escreve `duration: 300` ou `damping: 12` solto. Se o app
 * parecer lento ou "gelatinoso", o ajuste é aqui e vale para tudo de uma vez.
 *
 * A regra de uso:
 *   - o dedo causou o movimento  -> mola  (withSpring, SPRING.*)
 *   - o movimento só informa     -> tempo (withTiming, DURATION.*)
 *
 * E os três modos (ver `useMotionMode`):
 *   full     -> movimento completo (escala, deslocamento, mola)
 *   reduced  -> "Reduzir movimento" do sistema ligado: nada se desloca nem
 *               escala; o feedback vira troca de opacidade/cor (RF-54)
 *   off      -> ANIMATIONS_ENABLED = false: tudo instantâneo, mas o estado
 *               visual (cor, opacidade de "apertado") continua mudando (RF-55)
 */
import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutLeft,
  LinearTransition,
  ReduceMotion,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

/**
 * RF-55 — a chave geral. `false` desliga TODA animação do app (inclusive o
 * movimento da câmera do mapa). Os componentes continuam dando feedback de
 * estado, só que sem transição.
 */
export const ANIMATIONS_ENABLED = true;

export const DURATION = {
  /** Feedback de toque. Acima de ~150 ms o botão parece atrasado. */
  fast: 120,
  /** Aparecer, sumir, trocar de estado. */
  base: 220,
  /** Entrada de lista, algo que o olho precisa acompanhar. */
  slow: 360,
  /** Meio ciclo do "sinal de vida" do carregamento. */
  pulse: 420,
  /** Câmera do mapa indo até um ponto. */
  camera: 450,
} as const;

/*
 * Todas as configs levam `reduceMotion: Never` de propósito: quem decide se
 * anima é `useMotionMode()`, não o padrão do Reanimated. Sem isto, o
 * Reanimated leria a configuração do sistema por conta própria (e só na
 * abertura do app) e as duas decisões poderiam discordar.
 */
const never = ReduceMotion.Never;

export const SPRING = {
  /** Botão apertado: curto, quase sem quique. */
  press: { damping: 15, stiffness: 320, mass: 0.6, reduceMotion: never },
  /** A estrela de favoritar voltando ao tamanho: quique visível de propósito. */
  pop: { damping: 8, stiffness: 260, mass: 0.6, reduceMotion: never },
  /** Item que se acomoda na lista depois que outro saiu. */
  settle: { damping: 18, stiffness: 170, mass: 0.9, reduceMotion: never },
} satisfies Record<string, WithSpringConfig>;

export const TIMING = {
  fast: { duration: DURATION.fast, easing: Easing.out(Easing.quad), reduceMotion: never },
  enter: { duration: DURATION.base, easing: Easing.out(Easing.cubic), reduceMotion: never },
  pulse: { duration: DURATION.pulse, easing: Easing.inOut(Easing.quad), reduceMotion: never },
} satisfies Record<string, WithTimingConfig>;

/** Escalas e opacidades. 0.95 é pouco de propósito: o usuário sente, não repara. */
export const SCALE = { pressed: 0.95, pop: 1.4 };
export const OPACITY = { pressed: 0.55, flash: 0.25, pulseLow: 0.3 };
/** Altura do "pulinho" dos pontos de carregamento, em px. */
export const LOADING_BOUNCE = 6;

/**
 * RF-51 — entrada escalonada COM TETO. Sem o teto, o 30º card de uma lista
 * esperaria 1,8 s para aparecer; com ele, nada espera mais que `maxDelay`.
 */
export const STAGGER = { step: 55, maxDelay: 330 };

export function staggerDelay(index: number): number {
  return Math.min(index * STAGGER.step, STAGGER.maxDelay);
}

// ---- "Reduzir movimento" do sistema, ao vivo --------------------------------
//
// `useReducedMotion()` do Reanimated lê o valor uma vez e não re-renderiza se
// o usuário mudar a configuração com o app aberto. O AccessibilityInfo avisa
// a mudança, então a troca de modo acontece sem reiniciar o app.

let systemReducesMotion = false;
const listeners = new Set<() => void>();

function setSystemReducesMotion(value: boolean) {
  if (value === systemReducesMotion) return;
  systemReducesMotion = value;
  listeners.forEach((listener) => listener());
}

AccessibilityInfo.isReduceMotionEnabled()
  .then(setSystemReducesMotion)
  .catch(() => {
    // Sem a informação, assumimos movimento normal: o app continua inteiro.
  });
AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReducesMotion);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type MotionMode = 'full' | 'reduced' | 'off';

export function useMotionMode(): MotionMode {
  const reduced = useSyncExternalStore(subscribe, () => systemReducesMotion);
  if (!ANIMATIONS_ENABLED) return 'off';
  return reduced ? 'reduced' : 'full';
}

// ---- Animações de layout (entrada/saída de itens de lista) ------------------

/** RF-51: card entrando na lista. Reduzido = só aparece (sem subir). */
export function listItemEntering(mode: MotionMode, index: number) {
  if (mode === 'off') return undefined;
  if (mode === 'reduced') return APPEAR;
  return FadeInDown.duration(DURATION.slow).delay(staggerDelay(index)).reduceMotion(never);
}

// Os builders que não dependem do índice são criados uma vez só: a lista
// recebe sempre a mesma instância e não reconfigura a animação a cada render.
const EXIT_SLIDE = FadeOutLeft.duration(DURATION.base).reduceMotion(never);
const EXIT_FADE = FadeOut.duration(DURATION.base).reduceMotion(never);
const SETTLE = LinearTransition.springify()
  .damping(SPRING.settle.damping)
  .stiffness(SPRING.settle.stiffness)
  .mass(SPRING.settle.mass)
  .reduceMotion(never);
const APPEAR = FadeIn.duration(DURATION.base).reduceMotion(never);

/** RF-52: item removido saindo. Reduzido = some no lugar (sem deslizar). */
export function listItemExiting(mode: MotionMode) {
  if (mode === 'off') return undefined;
  return mode === 'reduced' ? EXIT_FADE : EXIT_SLIDE;
}

/** RF-52: quem fica se acomoda com mola. Reduzido/desligado = pula direto. */
export function listItemLayout(mode: MotionMode) {
  return mode === 'full' ? SETTLE : undefined;
}

/** Algo novo que aparece numa tela já montada (ex.: a avaliação recém-enviada). */
export function contentEntering(mode: MotionMode) {
  return mode === 'off' ? undefined : APPEAR;
}

/** Duração da câmera do mapa: 0 = pula direto para o ponto. */
export function cameraDuration(mode: MotionMode): number {
  return mode === 'full' ? DURATION.camera : 0;
}
