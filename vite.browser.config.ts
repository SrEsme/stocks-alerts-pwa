import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plain HTTP preview for localhost and the embedded browser.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5174, strictPort: true },
});
