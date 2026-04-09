import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import {
	NAV_SECTION_IDS,
	updateAllNavActive,
	sectionDocumentTop,
	setupSmoothSectionScroll,
	setupGlobalNavActive,
} from './nav-active'

/** Topos de documento simulados (como `getBoundingClientRect().top + scrollY`). */
const SECTION_TOP = {
	home: 0,
	solucoes: 200,
	sobre: 300,
	protocolo: 400,
	faq: 500,
	contato: 600,
} satisfies Record<(typeof NAV_SECTION_IDS)[number], number>

const NAV_LINK_LABELS: Record<(typeof NAV_SECTION_IDS)[number], string> = {
	home: 'Home',
	solucoes: 'Soluções',
	sobre: 'Sobre',
	protocolo: 'Protocolo',
	faq: 'FAQ',
	contato: 'Contato',
}

function buildNavLayoutHtml(): string {
	const primaryLinks = NAV_SECTION_IDS.map(
		(id) => `<a data-nav-section-link href="#${id}">${NAV_LINK_LABELS[id]}</a>`,
	).join('')
	const sections = NAV_SECTION_IDS.map((id) => `<section id="${id}"></section>`).join('')
	return `
		<nav aria-label="Principal">${primaryLinks}</nav>
		<nav aria-label="Navegação inferior">
			<a data-nav-section-link href="#home">Home</a>
			<a data-nav-section-link href="#contato">Contato</a>
		</nav>
		${sections}
	`
}

function installNavGeometryMock(scrollRef: { y: number }) {
	return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
		if (this.getAttribute('aria-label') === 'Principal') {
			return {
				top: 0,
				left: 0,
				right: 100,
				bottom: 64,
				width: 100,
				height: 64,
				x: 0,
				y: 0,
				toJSON: () => ({}),
			} as DOMRect
		}
		const id = this.id as keyof typeof SECTION_TOP
		const base = SECTION_TOP[id] ?? 0
		return {
			top: base - scrollRef.y,
			left: 0,
			right: 100,
			bottom: 50,
			width: 100,
			height: 50,
			x: 0,
			y: base - scrollRef.y,
			toJSON: () => ({}),
		} as DOMRect
	})
}

describe('nav-active (layout)', () => {
	const scrollRef = { y: 0 }
	let rectSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		scrollRef.y = 0
		Object.defineProperty(window, 'scrollY', {
			configurable: true,
			enumerable: true,
			get: () => scrollRef.y,
		})
		rectSpy = installNavGeometryMock(scrollRef)
		document.body.innerHTML = buildNavLayoutHtml()
	})

	afterEach(() => {
		rectSpy.mockRestore()
		document.body.replaceChildren()
		vi.restoreAllMocks()
	})

	function primaryNav() {
		return screen.getByRole('navigation', { name: 'Principal' })
	}

	function bottomNav() {
		return screen.getByRole('navigation', { name: 'Navegação inferior' })
	}

	it('should expose two navigations with distinct accessible names', () => {
		expect(primaryNav()).toBeInTheDocument()
		expect(bottomNav()).toBeInTheDocument()
	})

	it('should list every section link in the primary navigation', () => {
		const nav = primaryNav()
		for (const id of NAV_SECTION_IDS) {
			expect(within(nav).getByRole('link', { name: NAV_LINK_LABELS[id] })).toHaveAttribute('href', `#${id}`)
		}
	})

	it('should mark the correct primary link as active for scroll position', () => {
		scrollRef.y = 250
		updateAllNavActive()

		const nav = primaryNav()
		expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveClass('nav-link-active')
		expect(within(nav).getByRole('link', { name: 'Sobre' })).toHaveClass('nav-link-active')
	})

	it('should set aria-current="page" only on the active link in the primary nav', () => {
		scrollRef.y = 250
		updateAllNavActive()

		const nav = primaryNav()
		const active = within(nav).getByRole('link', { name: 'Sobre' })
		expect(active).toHaveAttribute('aria-current', 'page')

		for (const id of NAV_SECTION_IDS) {
			if (id === 'sobre') continue
			const link = within(nav).getByRole('link', { name: NAV_LINK_LABELS[id] })
			expect(link).not.toHaveAttribute('aria-current')
		}
	})

	it('should mirror active state on bottom nav but not set aria-current there', () => {
		scrollRef.y = 650
		updateAllNavActive()

		const primaryContato = within(primaryNav()).getByRole('link', { name: 'Contato' })
		const bottomContato = within(bottomNav()).getByRole('link', { name: 'Contato' })

		expect(primaryContato).toHaveClass('nav-link-active')
		expect(primaryContato).toHaveAttribute('aria-current', 'page')
		expect(bottomContato).toHaveClass('nav-link-active')
		expect(bottomContato).not.toHaveAttribute('aria-current')
	})

	it('should highlight home when near the top of the page', () => {
		scrollRef.y = 0
		updateAllNavActive()

		const home = within(primaryNav()).getByRole('link', { name: 'Home' })
		expect(home).toHaveClass('nav-link-active')
		expect(home).toHaveAttribute('aria-current', 'page')
	})

	it('should activate FAQ when scroll sits before contato', () => {
		scrollRef.y = 470
		updateAllNavActive()

		const nav = primaryNav()
		expect(within(nav).getByRole('link', { name: 'FAQ' })).toHaveClass('nav-link-active')
		expect(within(nav).getByRole('link', { name: 'FAQ' })).toHaveAttribute('aria-current', 'page')
		expect(within(nav).getByRole('link', { name: 'Contato' })).not.toHaveClass('nav-link-active')
	})

	it('should not throw when a section id from the list is missing from the DOM', () => {
		document.getElementById('contato')?.remove()
		scrollRef.y = 800
		expect(() => updateAllNavActive()).not.toThrow()
		const nav = primaryNav()
		expect(within(nav).getByRole('link', { name: 'FAQ' })).toHaveClass('nav-link-active')
	})
})

/** HTML mínimo para `setupSmoothSectionScroll` (âncora interna + secção alvo). */
function buildSmoothScrollFixture(): string {
	return `
		<nav aria-label="Principal">
			<a data-nav-section-link href="#sobre"><span>Ir para Sobre</span></a>
		</nav>
		<section id="sobre"></section>
	`
}

describe('setupSmoothSectionScroll', () => {
	let detachSmoothScroll: (() => void) | undefined
	const scrollRef = { y: 100 }
	const motionPrefs = { reduceMotion: false }
	let rectSpy: ReturnType<typeof vi.spyOn>
	let scrollToSpy: ReturnType<typeof vi.spyOn>
	let pushStateSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		scrollRef.y = 100
		motionPrefs.reduceMotion = false
		Object.defineProperty(window, 'scrollY', {
			configurable: true,
			enumerable: true,
			get: () => scrollRef.y,
		})
		document.body.innerHTML = buildSmoothScrollFixture()
		rectSpy = installNavGeometryMock(scrollRef)
		scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
		pushStateSpy = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})
		// jsdom pode não expor `matchMedia`
		window.matchMedia = vi.fn((query: string) => {
			const q = String(query)
			const isReduceQuery = q.includes('prefers-reduced-motion') && q.includes('reduce')
			return {
				matches: isReduceQuery && motionPrefs.reduceMotion,
				media: q,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			} as MediaQueryList
		}) as typeof window.matchMedia
		detachSmoothScroll = setupSmoothSectionScroll()
	})

	afterEach(() => {
		detachSmoothScroll?.()
		rectSpy.mockRestore()
		document.body.replaceChildren()
		vi.restoreAllMocks()
	})

	it('should scroll to section top minus primary nav height and offset with smooth behavior', async () => {
		const user = userEvent.setup()
		await user.click(screen.getByRole('link', { name: /ir para sobre/i }))
		// section sobre em 300, scrollY 100 → document top 300; nav 64; gap 8 → top 228
		expect(scrollToSpy).toHaveBeenCalledWith({ top: 228, behavior: 'smooth' })
		expect(pushStateSpy).toHaveBeenCalledWith(null, '', '#sobre')
	})

	it('should use scroll behavior auto when prefers-reduced-motion matches', async () => {
		motionPrefs.reduceMotion = true
		const user = userEvent.setup()
		await user.click(screen.getByRole('link', { name: /ir para sobre/i }))
		expect(scrollToSpy).toHaveBeenCalledWith({ top: 228, behavior: 'auto' })
	})

	it('should not call pushState when location hash already equals href', async () => {
		window.history.replaceState(null, '', '#sobre')
		pushStateSpy.mockClear()
		const user = userEvent.setup()
		await user.click(screen.getByRole('link', { name: /ir para sobre/i }))
		expect(scrollToSpy).toHaveBeenCalled()
		expect(pushStateSpy).not.toHaveBeenCalled()
	})

	it('should handle click on child inside the anchor via closest', async () => {
		const user = userEvent.setup()
		await user.click(screen.getByText('Ir para Sobre'))
		expect(scrollToSpy).toHaveBeenCalledWith({ top: 228, behavior: 'smooth' })
	})

	it('should not intercept meta-click (no scroll)', () => {
		const link = screen.getByRole('link', { name: /ir para sobre/i })
		link.dispatchEvent(
			new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true }),
		)
		expect(scrollToSpy).not.toHaveBeenCalled()
	})

	it('should not intercept middle mouse button', () => {
		const link = screen.getByRole('link', { name: /ir para sobre/i })
		link.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 1 }))
		expect(scrollToSpy).not.toHaveBeenCalled()
	})

	it('should not scroll when target section is missing', async () => {
		const link = screen.getByRole('link', { name: /ir para sobre/i })
		link.setAttribute('href', '#inexistente')
		const user = userEvent.setup()
		await user.click(link)
		expect(scrollToSpy).not.toHaveBeenCalled()
	})

	it('should ignore non-hash href on nav section links', () => {
		const link = screen.getByRole('link', { name: /ir para sobre/i })
		// `data:` não dispara navegação cross-document no jsdom (evita ruído no output)
		link.setAttribute('href', 'data:text/plain,test')
		link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
		expect(scrollToSpy).not.toHaveBeenCalled()
	})

	it('should not run when default was already prevented earlier in capture', async () => {
		const link = screen.getByRole('link', { name: /ir para sobre/i })
		link.addEventListener('click', (e) => e.preventDefault(), { capture: true })
		const user = userEvent.setup()
		await user.click(link)
		expect(scrollToSpy).not.toHaveBeenCalled()
	})
})

describe('sectionDocumentTop', () => {
	afterEach(() => {
		document.body.replaceChildren()
		vi.restoreAllMocks()
	})

	it('should return document top using bounding rect and scrollY', () => {
		const scrollRef = { y: 100 }
		Object.defineProperty(window, 'scrollY', {
			configurable: true,
			get: () => scrollRef.y,
		})
		const el = document.createElement('div')
		vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
			top: 40,
			left: 0,
			right: 0,
			bottom: 0,
			width: 0,
			height: 0,
			x: 0,
			y: 40,
			toJSON: () => ({}),
		} as DOMRect)

		expect(sectionDocumentTop(el)).toBe(140)
	})
})

/**
 * `setupGlobalNavActive` fixa estado de módulo (`navActiveInitialized`). Manter este `describe` por último no ficheiro.
 * Os spies em `addEventListener` não delegam ao DOM real para não acumular listeners entre ficheiros de teste.
 */
describe('setupGlobalNavActive', () => {
	it('should register scroll, hashchange and document click once and skip repeat inits', () => {
		const winSpy = vi.spyOn(window, 'addEventListener').mockImplementation(() => {})
		const docSpy = vi.spyOn(document, 'addEventListener').mockImplementation(() => {})

		setupGlobalNavActive()

		expect(winSpy.mock.calls.filter((c) => c[0] === 'scroll')).toHaveLength(1)
		expect(winSpy.mock.calls.filter((c) => c[0] === 'hashchange')).toHaveLength(1)
		expect(winSpy.mock.calls.find((c) => c[0] === 'scroll')?.[2]).toEqual({ passive: true })
		expect(docSpy.mock.calls.filter((c) => c[0] === 'click')).toHaveLength(1)

		winSpy.mockClear()
		docSpy.mockClear()
		setupGlobalNavActive()
		expect(winSpy).not.toHaveBeenCalled()
		expect(docSpy).not.toHaveBeenCalled()

		winSpy.mockRestore()
		docSpy.mockRestore()
	})
})
