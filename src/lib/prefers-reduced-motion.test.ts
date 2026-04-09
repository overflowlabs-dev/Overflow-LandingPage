/**
 * Testes de `prefersReducedMotion()` (`prefers-reduced-motion.ts`).
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { prefersReducedMotion } from './prefers-reduced-motion'

function mockMediaQueryList(matches: boolean, media: string): MediaQueryList {
	return {
		matches,
		media,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	} as MediaQueryList
}

describe('prefersReducedMotion', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	it('should return true when window is undefined (SSR / sem global window)', () => {
		vi.stubGlobal('window', undefined)
		expect(prefersReducedMotion()).toBe(true)
	})

	it('should query prefers-reduced-motion reduce and return matches when true', () => {
		const matchMedia = vi.fn((query: string) => mockMediaQueryList(true, query))
		window.matchMedia = matchMedia as typeof window.matchMedia
		expect(prefersReducedMotion()).toBe(true)
		expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
	})

	it('should return false when matchMedia reports no reduced motion preference', () => {
		window.matchMedia = vi.fn(() => mockMediaQueryList(false, '(prefers-reduced-motion: reduce)')) as typeof window.matchMedia
		expect(prefersReducedMotion()).toBe(false)
	})
})
