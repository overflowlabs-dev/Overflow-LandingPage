// @ts-check
import 'dotenv/config'
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { validateRequiredEnv } from './src/lib/env-provider.mjs'

validateRequiredEnv(process.env)

// https://astro.build/config
export default defineConfig({
	site: 'https://overflowlabs.com.br',
	integrations: [sitemap()],
	vite: {
		plugins: [tailwindcss()],
	},
})
