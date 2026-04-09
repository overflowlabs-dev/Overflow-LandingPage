import { z } from 'zod'

const requiredPublicEnvSchema = z.object({
	PUBLIC_WEB3FORMS_ACCESS_KEY: z.string().trim().min(1, 'PUBLIC_WEB3FORMS_ACCESS_KEY is required'),
	PUBLIC_WHATSAPP_URL: z.string().trim().url('PUBLIC_WHATSAPP_URL must be a valid URL'),
	PUBLIC_INSTAGRAM_URL: z.string().trim().url('PUBLIC_INSTAGRAM_URL must be a valid URL'),
	PUBLIC_FORM_ENDPOINT: z.string().trim().url('PUBLIC_FORM_ENDPOINT must be a valid URL'),
})

let cachedPublicEnv

/**
 * Validates mandatory env vars on Astro startup (dev/build/preview).
 * Throws with a readable message when missing/invalid.
 */
export function validateRequiredEnv(env = process.env) {
	const parsed = requiredPublicEnvSchema.safeParse(env)
	if (parsed.success) {
		cachedPublicEnv = parsed.data
		return parsed.data
	}

	const details = parsed.error.issues
		.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
		.join('\n- ')

	throw new Error(
		`Invalid environment variables:\n- ${details}\n\nPlease fix your .env before running the project.`,
	)
}

export function getPublicEnv(env = process.env) {
	if (!cachedPublicEnv) {
		cachedPublicEnv = validateRequiredEnv(env)
	}
	return cachedPublicEnv
}
