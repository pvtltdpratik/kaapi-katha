import { Variants } from "framer-motion";

/*
 * Motion is kept to one gesture: a short rise-and-fade the first time something
 * enters the viewport. Nothing loops and nothing competes with the cup.
 */

const ease = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};
