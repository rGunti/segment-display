import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '',
  root: './src',
  build: {
    sourcemap: true,
    outDir: '../dist',
    emptyOutDir: true,
    copyPublicDir: true,
    rollupOptions: {
      input: {
        main: path.join(__dirname, 'src', 'index.html'),
        display: path.join(__dirname, 'src', 'index.html'),
        gps: path.join(__dirname, 'src', 'gps.html'),
        config: path.join(__dirname, 'src', 'config.html'),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        //additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
  plugins: [
    // legacy({
    //   targets: ['defaults', 'iOS >= 6', 'IE 11'],
    // }),
  ],
});
