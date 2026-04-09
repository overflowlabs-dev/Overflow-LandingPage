import { animate, stagger } from 'motion'

/** Easing snappy (Motion One / skill). */
export const revealEase = [0.16, 1, 0.3, 1] as const

type RevealKeyframes = {
	opacity?: [number, number]
	y?: [number, number]
}

type RevealOptions = {
	duration?: number
	delay?: number | ReturnType<typeof stagger>
	easing?: readonly [number, number, number, number] | string
}

/**
 * Wrapper sobre `animate` do Motion com keyframes de opacity/y —
 * contorna incompatibilidades de tipagem DOM do pacote `motion`.
 */
export function domReveal(
	targets: Element | Element[] | ArrayLike<Element>,
	keyframes: RevealKeyframes,
	options: RevealOptions = {},
) {
	const list =
		targets instanceof Element
			? [targets]
			: Array.from(targets as ArrayLike<Element>)

	return animate(list, keyframes as never, {
		duration: options.duration ?? 0.55,
		delay: options.delay,
		easing: (options.easing ?? revealEase) as never,
	} as never)
}

export { stagger, inView } from 'motion'
