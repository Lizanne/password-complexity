import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base ('./') so the build works at any deploy root:
  //   - GitHub Pages:  https://lizanne.github.io/password-complexity/
  //   - Vercel:        https://password-complexity.vercel.app/
  // Assets resolve relative to index.html in both.
  base: './',
})
