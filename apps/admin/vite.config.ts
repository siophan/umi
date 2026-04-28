import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  envDir: '../..',
  base: '/admin/',
  plugins: [react()],
  server: {
    port: 3001,
  },
});
