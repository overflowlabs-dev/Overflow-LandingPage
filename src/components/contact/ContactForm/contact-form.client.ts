import { z } from 'zod'

export const NAME_MAX_LENGTH = 100
export const EMAIL_MAX_LENGTH = 254
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const phoneRegex = /^\(\d{2}\) 9 \d{4}-\d{4}$/

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

	const onSubmit = async (e: Event) => {
		e.preventDefault()
		const accessKeyInput = form.querySelector<HTMLInputElement>('input[name="access_key"]')
		const hCaptchaField = form.querySelector<HTMLTextAreaElement>('textarea[name="h-captcha-response"]')
		const hCaptcha = hCaptchaField?.value?.trim() ?? ''

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
			const firstIssue = parsed.error.issues[0]
			showStatus(firstIssue?.message ?? 'Revise os campos do formulário.', true)
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

	phoneInput?.addEventListener('input', onPhoneInput)
	form.addEventListener('submit', onSubmit)
	return () => {
		phoneInput?.removeEventListener('input', onPhoneInput)
		form.removeEventListener('submit', onSubmit)
	}
}
