import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // เปลี่ยนจาก '/zoneidea/' เป็น '/SMS/' (ต้องพิมพ์ตัวเล็ก/ใหญ่ ให้ตรงกับชื่อ Repo เป๊ะๆ)
  base: '/SMS/', 
})
