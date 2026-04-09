/** Ordem das âncoras — usado pelo header desktop e pela bottom bar mobile. */
export const NAV_SECTION_IDS = ['home', 'solucoes', 'sobre', 'protocolo', 'faq', 'contato'] as const

export function sectionDocumentTop(el: HTMLElement): number {
	return el.getBoundingClientRect().top + window.scrollY
}

/**
 * Intercepta cliques em `[data-nav-section-link]` com `href` interno (`#id`) e faz scroll
 * até à secção, respeitando `prefers-reduced-motion`. Devolve cleanup (remove o listener).
 */
export function setupSmoothSectionScroll(): () => void {
	const onClick = (event: MouseEvent) => {
		const trigger = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>(
			'[data-nav-section-link]',
		)
		if (!trigger) return
		if (event.defaultPrevented) return
		if (event.button !== 0) return
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

		const href = trigger.getAttribute('href')
		if (!href?.startsWith('#')) return

		const id = href.slice(1)
		const target = document.getElementById(id)
		if (!target) return

		event.preventDefault()
		const topNav = document.querySelector('nav[aria-label="Principal"]')
		const navH = topNav?.getBoundingClientRect().height ?? 64
		const top = Math.max(0, sectionDocumentTop(target) - navH - 8)
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })

		if (window.location.hash !== href) {
			window.history.pushState(null, '', href)
		}
	}
	document.addEventListener('click', onClick)
	return () => document.removeEventListener('click', onClick)
}

export function updateAllNavActive(): void {
	const topNav = document.querySelector('nav[aria-label="Principal"]')
	const navH = topNav?.getBoundingClientRect().height ?? 64
	const y = window.scrollY + navH + 16
	let activeId = ''
	for (const id of NAV_SECTION_IDS) {
		const el = document.getElementById(id)
		if (!el) continue
		if (y >= sectionDocumentTop(el)) activeId = id
	}

	document.querySelectorAll<HTMLAnchorElement>('[data-nav-section-link]').forEach((a) => {
		const href = a.getAttribute('href')
		const isActive = href === `#${activeId}`
		a.classList.toggle('nav-link-active', isActive)
		const inPrimaryNav = a.closest('nav[aria-label="Principal"]')
		if (inPrimaryNav) {
			if (isActive) a.setAttribute('aria-current', 'page')
			else a.removeAttribute('aria-current')
		}
	})
}

let navActiveInitialized = false

export function setupGlobalNavActive(): void {
	if (navActiveInitialized) return
	navActiveInitialized = true
	setupSmoothSectionScroll() // cleanup ignorado: lifetime da página
	updateAllNavActive()
	window.addEventListener('scroll', updateAllNavActive, { passive: true })
	window.addEventListener('hashchange', updateAllNavActive)
}
