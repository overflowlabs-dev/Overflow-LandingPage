import { domReveal, revealEase } from '../../../lib/animate-dom'
import { prefersReducedMotion } from '../../../lib/prefers-reduced-motion'

export type FaqOpenMotionDeps = {
	prefersReducedMotion?: () => boolean
	domReveal?: typeof domReveal
	revealEase?: readonly [number, number, number, number]
}

/**
 * Ao abrir cada `<details data-faq-item>`, anima `[data-faq-answer]` e remove estilos inline no fim.
 * Sem efeito quando `prefers-reduced-motion` está ativo.
 */
export function setupFaqOpenMotion(root: ParentNode = document, deps?: FaqOpenMotionDeps): () => void {
	const prefersFn = deps?.prefersReducedMotion ?? prefersReducedMotion
	if (prefersFn()) return () => {}

	const reveal = deps?.domReveal ?? domReveal
	const ease = deps?.revealEase ?? revealEase
	const cleanups: (() => void)[] = []

	root.querySelectorAll<HTMLDetailsElement>('[data-faq-item]').forEach((details) => {
		const answer = details.querySelector<HTMLElement>('[data-faq-answer]')
		if (!answer) return

		const onToggle = () => {
			if (!details.open) return
			answer.style.opacity = '0'
			answer.style.transform = 'translateY(10px)'
			reveal(answer, { opacity: [0, 1], y: [10, 0] }, {
				duration: 0.4,
				easing: ease,
			})?.finished?.finally(() => {
				answer.style.removeProperty('opacity')
				answer.style.removeProperty('transform')
			})
		}

		details.addEventListener('toggle', onToggle)
		cleanups.push(() => details.removeEventListener('toggle', onToggle))
	})

	return () => cleanups.forEach((fn) => fn())
}
