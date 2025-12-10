import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/zoneidea/', // แก้ให้ตรงกับชื่อ Repository บน GitHub
})
