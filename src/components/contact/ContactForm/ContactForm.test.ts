/**
 * Testes do fluxo do formulário de contato (`contact-form.client.ts`, usado por `ContactForm/index.astro`).
 * HTML mínimo espelha o DOM real; evita Container/import `.astro`.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import {
	initContactForm,
	NAME_MAX_LENGTH,
	EMAIL_MAX_LENGTH,
} from './contact-form.client'

const ENDPOINT = 'https://api.web3forms.com/submit'

type MountContactFormOptions = {
	accessKey?: string
	/** Padrão `token`. `''` = textarea vazio. `false` = sem campo de captcha. */
	captcha?: string | false
	values?: Partial<{ name: string; phone: string; email: string; message: string }>
}

function buildContactFormHtml(opts: MountContactFormOptions = {}): string {
	const accessKey = opts.accessKey ?? 'test-key'
	const { name = '', phone = '', email = '', message = '' } = opts.values ?? {}
	const captchaBlock =
		opts.captcha === false
			? ''
			: `<textarea name="h-captcha-response">${opts.captcha === undefined ? 'token' : opts.captcha}</textarea>`

	return `
		<form id="contact-form" novalidate>
			<input type="hidden" name="access_key" value="${accessKey}" />
			<label for="contact-name">Nome</label>
			<p id="contact-name-error" class="hidden" role="alert" aria-live="polite"></p>
			<input id="contact-name" name="name" type="text" value="${name}" aria-describedby="contact-name-error" />
			<label for="contact-phone">Telefone (WhatsApp)</label>
			<p id="contact-phone-error" class="hidden" role="alert" aria-live="polite"></p>
			<input id="contact-phone" name="phone" type="tel" value="${phone}" aria-describedby="contact-phone-error" />
			<label for="contact-email">E-mail</label>
			<p id="contact-email-error" class="hidden" role="alert" aria-live="polite"></p>
			<input id="contact-email" name="email" type="email" value="${email}" aria-describedby="contact-email-error" />
			<label for="contact-message">O que você precisa desenvolver ou automatizar?</label>
			<p id="contact-message-error" class="hidden" role="alert" aria-live="polite"></p>
			<textarea id="contact-message" name="message" aria-describedby="contact-message-error">${message}</textarea>
			<button type="submit">Receber diagnóstico gratuito</button>
			${captchaBlock}
			<p id="form-status" class="hidden" role="status" aria-live="polite"></p>
		</form>
	`
}

function mountContactFormHarness(opts: MountContactFormOptions = {}) {
	document.body.innerHTML = buildContactFormHtml(opts)
	const form = document.getElementById('contact-form')
	if (!(form instanceof HTMLFormElement)) {
		throw new Error('Expected #contact-form')
	}
	const cleanup = initContactForm(form, { formSubmitEndpoint: ENDPOINT })
	return { form, cleanup }
}

describe('ContactForm', () => {
	let cleanup: (() => void) | undefined

	afterEach(() => {
		cleanup?.()
		cleanup = undefined
		document.body.replaceChildren()
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	it('should expose status region with role and aria-live for screen readers', () => {
		cleanup = mountContactFormHarness().cleanup
		const status = screen.getByRole('status')
		expect(status).toHaveAttribute('aria-live', 'polite')
		expect(status).toHaveAttribute('id', 'form-status')
	})

	it('should associate labels with inputs for acessibilidade', () => {
		cleanup = mountContactFormHarness().cleanup
		expect(screen.getByLabelText(/^nome$/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/telefone \(whatsapp\)/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/^e-mail$/i)).toBeInTheDocument()
		expect(
			screen.getByLabelText(/o que você precisa desenvolver ou automatizar/i),
		).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /receber diagnóstico gratuito/i })).toBeInTheDocument()
	})

	it('should show the first required field error when submitting empty form', async () => {
		const user = userEvent.setup()
		cleanup = mountContactFormHarness({ captcha: 'x' }).cleanup

		await user.click(screen.getByRole('button', { name: /receber diagnóstico gratuito/i }))

		const nameError = document.getElementById('contact-name-error')
		expect(nameError).toBeTruthy()
		expect(nameError).toHaveTextContent('Informe um nome.')
		expect(screen.getByRole('status')).toHaveTextContent('')
	})

	it('should exigir captcha antes do envio', async () => {
		const user = userEvent.setup()
		cleanup = mountContactFormHarness({
			captcha: false,
			values: { name: 'A', phone: '(41) 9 9999-9999', email: 'a@b.co', message: 'Oi' },
		}).cleanup

		await user.click(screen.getByRole('button', { name: /receber diagnóstico gratuito/i }))

		expect(screen.getByRole('status')).toHaveTextContent('Por favor, complete o captcha.')
	})

	it('should reject when access key is missing', async () => {
		const user = userEvent.setup()
		cleanup = mountContactFormHarness({
			accessKey: '',
			values: { name: 'A', phone: '(41) 9 9999-9999', email: 'a@b.co', message: 'Oi' },
		}).cleanup

		await user.click(screen.getByRole('button', { name: /receber diagnóstico gratuito/i }))

		expect(screen.getByRole('status')).toHaveTextContent(
			'Formulário indisponível no momento. Tente mais tarde.',
		)
	})

	it('should reject e-mail em formato inválido', async () => {
		const user = userEvent.setup()
		cleanup = mountContactFormHarness({
			values: { name: 'Maria', phone: '(41) 9 9999-9999', email: 'invalid-email', message: 'Texto' },
		}).cleanup

		await user.click(screen.getByRole('button', { name: /receber diagnóstico gratuito/i }))

		expect(document.getElementById('contact-email-error')).toHaveTextContent(
			'Informe um e-mail em formato válido (ex.: nome@dominio.com).',
		)
	})

	it('should reject telefone em formato inválido', async () => {
		const user = userEvent.setup()
		cleanup = mountContactFormHarness({
			values: { name: 'Maria', phone: '41999999999', email: 'maria@example.com', message: 'Texto' },
		}).cleanup

		await user.click(screen.getByRole('button', { name: /receber diagnóstico gratuito/i }))

		expect(document.getElementById('contact-phone-error')).toHaveTextContent(
			'Informe um telefone válido no formato (41) 9 9999-9999.',
		)
	})

	it('should apply telefone mask while typing', async () => {
		const user = userEvent.setup()
		cleanup = mountContactFormHarness().cleanup

		const phoneInput = screen.getByLabelText(/telefone \(whatsapp\)/i) as HTMLInputElement
		await user.type(phoneInput, '41999999999')
		expect(phoneInput.value).toBe('(41) 9 9999-9999')
	})

	it('should reject nome acima do limite', async () => {
		const user = userEvent.setup()
		const longName = 'x'.repeat(NAME_MAX_LENGTH + 1)
		cleanup = mountContactFormHarness({
			values: { name: longName, phone: '(41) 9 9999-9999', email: 'a@b.co', message: 'Ok' },
		}).cleanup

		await user.click(screen.getByRole('button', { name: /receber diagnóstico gratuito/i }))

		expect(document.getElementById('contact-name-error')).toHaveTextContent(
			`Nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`,
		)
	})

	it('should reject e-mail acima do limite', async () => {
		const user = userEvent.setup()
		const local = 'a'.repeat(EMAIL_MAX_LENGTH)
		const email = `${local}@x.co`
		cleanup = mountContactFormHarness({
			values: { name: 'A', phone: '(41) 9 9999-9999', email, message: 'Ok' },
		}).cleanup

		await user.click(screen.getByRole('button', { name: /receber diagnóstico gratuito/i }))

		expect(document.getElementById('contact-email-error')).toHaveTextContent(
			`E-mail deve ter no máximo ${EMAIL_MAX_LENGTH} caracteres.`,
		)
	})

	it('should enviar via fetch e mostrar sucesso quando a API aceita', async () => {
		const user = userEvent.setup()
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ success: true }),
			}),
		)

		cleanup = mountContactFormHarness({ captcha: '' }).cleanup
		await user.type(screen.getByLabelText(/^nome$/i), 'Maria')
		await user.type(screen.getByLabelText(/telefone \(whatsapp\)/i), '41999999999')
		await user.type(screen.getByLabelText(/^e-mail$/i), 'maria@example.com')
		await user.type(screen.getByLabelText(/o que você precisa desenvolver ou automatizar/i), 'Projeto')
		const captcha = document.querySelector<HTMLTextAreaElement>('textarea[name="h-captcha-response"]')
		if (captcha) captcha.value = 'ok-token'

		await user.click(screen.getByRole('button', { name: /receber diagnóstico gratuito/i }))

		expect(fetch).toHaveBeenCalledWith(
			ENDPOINT,
			expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
		)
		const status = screen.getByRole('status')
		expect(status).toHaveAttribute('aria-live', 'polite')
		expect(status).toHaveTextContent('Mensagem enviada. Entraremos em contato em breve.')
	})

	it('should show generic error when API returns success false', async () => {
		const user = userEvent.setup()
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ success: false }),
			}),
		)

		cleanup = mountContactFormHarness({
			values: { name: 'Maria', phone: '(41) 9 9999-9999', email: 'maria@example.com', message: 'Oi' },
		}).cleanup

		await user.click(screen.getByRole('button', { name: /receber diagnóstico gratuito/i }))

		expect(screen.getByRole('status')).toHaveTextContent(
			'Não foi possível enviar. Tente novamente mais tarde.',
		)
	})

	it('should show generic error when fetch fails', async () => {
		const user = userEvent.setup()
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))

		cleanup = mountContactFormHarness({
			values: { name: 'Maria', phone: '(41) 9 9999-9999', email: 'maria@example.com', message: 'Oi' },
		}).cleanup

		await user.click(screen.getByRole('button', { name: /receber diagnóstico gratuito/i }))

		expect(screen.getByRole('status')).toHaveTextContent(
			'Não foi possível enviar. Tente novamente mais tarde.',
		)
	})
})
