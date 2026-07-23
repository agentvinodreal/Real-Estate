/** Shared easing curve — matches tokens.css --ease-out-expo, reused from apps/web. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

/** Stagger container for card grids / lists. Apply to the parent, fadeUpItem to each child. */
export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
}

export const fadeUpItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.2, ease: EASE_OUT_EXPO } },
}

/** Page-level entrance used for route content in Layout's <Outlet>. */
export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.35, ease: EASE_OUT_EXPO },
}
