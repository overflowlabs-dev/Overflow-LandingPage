/**
 * Testes do contrato de `domReveal` (`animate-dom.ts`): delegação a `motion/animate` com lista normalizada e defaults.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const { animateMock } = vi.hoisted(() => ({
	animateMock: vi.fn(() => ({ finished: Promise.resolve() })),
}))

vi.mock('motion', async (importOriginal) => {
	const mod = await importOriginal<typeof import('motion')>()
	return { ...mod, animate: animateMock }
})

import { domReveal, revealEase } from './animate-dom'

describe('domReveal', () => {
	beforeEach(() => {
		animateMock.mockClear()
	})

	afterEach(() => {
		document.body.replaceChildren()
	})

	it('should call animate with a single element as a one-item array', () => {
		const el = document.createElement('div')
		domReveal(el, { opacity: [0, 1] })
		expect(animateMock).toHaveBeenCalledWith(
			[el],
			{ opacity: [0, 1] },
			expect.objectContaining({
				duration: 0.55,
				easing: revealEase,
			}),
		)
	})

	it('should normalize ArrayLike targets to an array of elements', () => {
		document.body.innerHTML = '<div></div><div></div>'
		const nodes = document.querySelectorAll('div')
		domReveal(nodes, { y: [10, 0] })
		expect(animateMock).toHaveBeenCalledWith(
			Array.from(nodes),
			{ y: [10, 0] },
			expect.objectContaining({ duration: 0.55, easing: revealEase }),
		)
	})

	it('should forward custom duration, delay and easing', () => {
		const el = document.createElement('div')
		const delay = 0.12
		const customEase = [0, 0, 1, 1] as const
		domReveal(el, { opacity: [0, 1] }, { duration: 0.2, delay, easing: customEase })
		expect(animateMock).toHaveBeenCalledWith(
			[el],
			{ opacity: [0, 1] },
			expect.objectContaining({ duration: 0.2, delay, easing: customEase }),
		)
	})

	it('should return the value from animate()', () => {
		const ret = { finished: Promise.resolve('done') }
		animateMock.mockReturnValueOnce(ret)
		const el = document.createElement('div')
		expect(domReveal(el, { opacity: [1, 0] })).toBe(ret)
	})
})
