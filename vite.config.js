import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves at /password-complexity/ — use base in production builds only.
  base: command === 'build' ? '/password-complexity/' : '/',
}))
