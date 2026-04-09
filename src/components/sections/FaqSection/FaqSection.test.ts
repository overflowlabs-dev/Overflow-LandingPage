/**
 * Testes do motion ao abrir FAQ (`faq-open-motion.client.ts`, usado por `FaqSection/index.astro`).
 * HTML mínimo espelha `data-faq-item` / `data-faq-answer`; `domReveal` injetado para não depender de `motion`.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { revealEase } from '../../../lib/animate-dom'
import { setupFaqOpenMotion } from './faq-open-motion.client'

function buildFaqFixture(): string {
	return `
		<details data-faq-item>
			<summary>Pergunta um</summary>
			<div data-faq-answer>Resposta um</div>
		</details>
		<details data-faq-item>
			<summary>Pergunta dois</summary>
			<div data-faq-answer>Resposta dois</div>
		</details>
	`
}

function mockDomReveal() {
	return vi.fn(() => ({
		finished: {
			finally(onFinally: () => void) {
				onFinally()
				return Promise.resolve()
			},
		},
	}))
}

describe('FaqSection', () => {
	let cleanup: (() => void) | undefined

	afterEach(() => {
		cleanup?.()
		cleanup = undefined
		document.body.replaceChildren()
		vi.restoreAllMocks()
	})

	describe('setupFaqOpenMotion', () => {
		it('should do nothing when prefers reduced motion', () => {
			const domRevealFn = mockDomReveal()
			document.body.innerHTML = buildFaqFixture()
			cleanup = setupFaqOpenMotion(document.body, {
				prefersReducedMotion: () => true,
				domReveal: domRevealFn,
			})
			expect(domRevealFn).not.toHaveBeenCalled()
		})

		it('should call domReveal with answer keyframes and cleanup inline styles when opening', async () => {
			const domRevealFn = mockDomReveal()
			document.body.innerHTML = buildFaqFixture()
			cleanup = setupFaqOpenMotion(document.body, {
				prefersReducedMotion: () => false,
				domReveal: domRevealFn,
			})

			const user = userEvent.setup()
			await user.click(screen.getByText('Pergunta um'))

			const answer = screen.getByText('Resposta um')
			expect(domRevealFn).toHaveBeenCalledTimes(1)
			expect(domRevealFn).toHaveBeenCalledWith(
				answer,
				{ opacity: [0, 1], y: [10, 0] },
				expect.objectContaining({ duration: 0.4, easing: revealEase }),
			)
			expect(answer.style.opacity).toBe('')
			expect(answer.style.transform).toBe('')
		})

		it('should not call domReveal when details closes', async () => {
			const domRevealFn = mockDomReveal()
			document.body.innerHTML = buildFaqFixture()
			cleanup = setupFaqOpenMotion(document.body, {
				prefersReducedMotion: () => false,
				domReveal: domRevealFn,
			})

			const details = document.querySelectorAll<HTMLDetailsElement>('[data-faq-item]')[0]!
			const user = userEvent.setup()
			await user.click(screen.getByText('Pergunta um'))
			expect(domRevealFn).toHaveBeenCalledTimes(1)
			domRevealFn.mockClear()
			await user.click(screen.getByText('Pergunta um'))
			expect(details.open).toBe(false)
			expect(domRevealFn).not.toHaveBeenCalled()
		})

		it('should not throw when data-faq-answer is missing', () => {
			document.body.innerHTML = `
			<details data-faq-item><summary>Só pergunta</summary></details>
		`
			expect(() =>
				setupFaqOpenMotion(document.body, {
					prefersReducedMotion: () => false,
					domReveal: mockDomReveal(),
				}),
			).not.toThrow()
		})

		it('should stop handling toggles after cleanup', async () => {
			const domRevealFn = mockDomReveal()
			document.body.innerHTML = buildFaqFixture()
			cleanup = setupFaqOpenMotion(document.body, {
				prefersReducedMotion: () => false,
				domReveal: domRevealFn,
			})
			cleanup()
			cleanup = undefined

			const user = userEvent.setup()
			await user.click(screen.getByText('Pergunta um'))
			expect(domRevealFn).not.toHaveBeenCalled()
		})

		it('should only animate the opened item when multiple details exist', async () => {
			const domRevealFn = mockDomReveal()
			document.body.innerHTML = buildFaqFixture()
			cleanup = setupFaqOpenMotion(document.body, {
				prefersReducedMotion: () => false,
				domReveal: domRevealFn,
			})

			const user = userEvent.setup()
			await user.click(screen.getByText('Pergunta dois'))

			expect(domRevealFn).toHaveBeenCalledTimes(1)
			expect(domRevealFn).toHaveBeenCalledWith(
				screen.getByText('Resposta dois'),
				{ opacity: [0, 1], y: [10, 0] },
				expect.objectContaining({ duration: 0.4, easing: revealEase }),
			)
		})
	})
})
