import { z } from 'zod'

export const NAME_MAX_LENGTH = 100
export const EMAIL_MAX_LENGTH = 254
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const phoneRegex = /^\(\d{2}\) 9 \d{4}-\d{4}$/

const FIELD_NAMES = ['name', 'phone', 'email', 'message'] as const
type ContactFieldName = (typeof FIELD_NAMES)[number]

function applyPhoneMask(value: string): string {
	const digits = value.replace(/\D/g, '').slice(0, 11)
	if (!digits) return ''

	if (digits.length <= 2) return `(${digits}`
	if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
	if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`
	return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`
}

export type ContactFormInitOptions = {
	formSubmitEndpoint: string
	fetchFn?: typeof fetch
	onStatus?: (message: string, isError: boolean) => void
	resetCaptcha?: () => void
}

const contactFormSchema = z.object({
	name: z
		.string()
		.min(1, 'Informe um nome.')
		.max(NAME_MAX_LENGTH, `Nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`),
	phone: z
		.string()
		.min(1, 'Informe um telefone.')
		.regex(phoneRegex, 'Informe um telefone válido no formato (41) 9 9999-9999.'),
	email: z
		.string()
		.min(1, 'Informe um e-mail.')
		.max(EMAIL_MAX_LENGTH, `E-mail deve ter no máximo ${EMAIL_MAX_LENGTH} caracteres.`)
		.regex(emailRegex, 'Informe um e-mail em formato válido (ex.: nome@dominio.com).'),
	message: z.string().min(1, 'Informe uma mensagem.'),
})

function fieldErrorId(name: ContactFieldName): string {
	return name === 'message' ? 'contact-message-error' : `contact-${name}-error`
}

function getFieldControl(form: HTMLFormElement, name: ContactFieldName): HTMLInputElement | HTMLTextAreaElement | null {
	return form.querySelector(`[name="${name}"]`)
}

function clearFieldErrors(form: HTMLFormElement) {
	const doc = form.ownerDocument
	for (const name of FIELD_NAMES) {
		const errEl = doc.getElementById(fieldErrorId(name))
		if (errEl) {
			errEl.textContent = ''
			errEl.classList.add('hidden')
		}
		const control = getFieldControl(form, name)
		if (control) {
			control.removeAttribute('aria-invalid')
			control.classList.remove('border-b-red-400/90')
		}
	}
}

function showFieldError(form: HTMLFormElement, name: ContactFieldName, message: string) {
	const doc = form.ownerDocument
	const errEl = doc.getElementById(fieldErrorId(name))
	if (errEl) {
		errEl.textContent = message
		errEl.classList.remove('hidden')
	}
	const control = getFieldControl(form, name)
	if (control) {
		control.setAttribute('aria-invalid', 'true')
		control.classList.add('border-b-red-400/90')
	}
}

function defaultShowStatus(
	statusEl: HTMLElement | null,
	message: string,
	isError: boolean,
) {
	if (!statusEl) return
	statusEl.textContent = message
	statusEl.classList.remove('hidden', 'text-red-300', 'text-green-300', 'text-secondary')
	statusEl.classList.add(isError ? 'text-red-300' : 'text-green-300')
}

function hideGlobalStatus(statusEl: HTMLElement | null) {
	if (!statusEl) return
	statusEl.textContent = ''
	statusEl.classList.add('hidden')
	statusEl.classList.remove('text-red-300', 'text-green-300', 'text-secondary')
}

/**
 * Liga validação + envio ao Web3Forms. Retorna função de cleanup (remove listener).
 */
export function initContactForm(
	form: HTMLFormElement,
	options: ContactFormInitOptions,
): () => void {
	const statusEl = form.ownerDocument.getElementById('form-status')
	const { formSubmitEndpoint, fetchFn = fetch, resetCaptcha } = options
	const phoneInput = form.querySelector<HTMLInputElement>('[name="phone"]')

	const showStatus = (message: string, isError: boolean) => {
		options.onStatus?.(message, isError)
		defaultShowStatus(statusEl, message, isError)
	}

	const clearValidationUi = () => {
		clearFieldErrors(form)
		hideGlobalStatus(statusEl)
	}

	const onSubmit = async (e: Event) => {
		e.preventDefault()
		const accessKeyInput = form.querySelector<HTMLInputElement>('input[name="access_key"]')
		const hCaptchaField = form.querySelector<HTMLTextAreaElement>('textarea[name="h-captcha-response"]')
		const hCaptcha = hCaptchaField?.value?.trim() ?? ''

		clearValidationUi()

		if (!accessKeyInput?.value?.trim()) {
			showStatus('Formulário indisponível no momento. Tente mais tarde.', true)
			return
		}
		if (!formSubmitEndpoint?.trim()) {
			showStatus('Formulário indisponível no momento. Tente mais tarde.', true)
			return
		}

		const name = (form.querySelector<HTMLInputElement>('[name="name"]')?.value ?? '').trim()
		const phone = (form.querySelector<HTMLInputElement>('[name="phone"]')?.value ?? '').trim()
		const email = (form.querySelector<HTMLInputElement>('[name="email"]')?.value ?? '').trim()
		const message = (form.querySelector<HTMLTextAreaElement>('[name="message"]')?.value ?? '').trim()

		const parsed = contactFormSchema.safeParse({ name, phone, email, message })
		if (!parsed.success) {
			const fieldErrors = parsed.error.flatten().fieldErrors
			for (const nameKey of FIELD_NAMES) {
				const msg = fieldErrors[nameKey]?.[0]
				if (msg) showFieldError(form, nameKey, msg)
			}
			const firstPath = parsed.error.issues[0]?.path[0]
			if (typeof firstPath === 'string' && FIELD_NAMES.includes(firstPath as ContactFieldName)) {
				getFieldControl(form, firstPath as ContactFieldName)?.focus()
			}
			return
		}

		if (!hCaptcha) {
			showStatus('Por favor, complete o captcha.', true)
			return
		}

		const fd = new FormData(form)

		try {
			const res = await fetchFn(formSubmitEndpoint, { method: 'POST', body: fd })
			const data = (await res.json()) as { success?: boolean }
			if (data.success) {
				clearFieldErrors(form)
				showStatus('Mensagem enviada. Entraremos em contato em breve.', false)
				form.reset()
				resetCaptcha?.()
			} else {
				showStatus('Não foi possível enviar. Tente novamente mais tarde.', true)
			}
		} catch {
			showStatus('Não foi possível enviar. Tente novamente mais tarde.', true)
		}
	}

	const onPhoneInput = () => {
		if (!phoneInput) return
		phoneInput.value = applyPhoneMask(phoneInput.value)
	}

	const clearErrorOnInput = (e: Event) => {
		const t = e.target
		if (!(t instanceof HTMLInputElement) && !(t instanceof HTMLTextAreaElement)) return
		const n = t.getAttribute('name')
		if (!n || !FIELD_NAMES.includes(n as ContactFieldName)) return
		const errEl = form.ownerDocument.getElementById(fieldErrorId(n as ContactFieldName))
		if (errEl && !errEl.classList.contains('hidden')) {
			errEl.textContent = ''
			errEl.classList.add('hidden')
			t.removeAttribute('aria-invalid')
			t.classList.remove('border-b-red-400/90')
		}
	}

	phoneInput?.addEventListener('input', onPhoneInput)
	form.addEventListener('input', clearErrorOnInput, true)
	form.addEventListener('submit', onSubmit)
	return () => {
		phoneInput?.removeEventListener('input', onPhoneInput)
		form.removeEventListener('input', clearErrorOnInput, true)
		form.removeEventListener('submit', onSubmit)
	}
}
