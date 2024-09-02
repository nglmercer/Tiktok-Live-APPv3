import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'node:path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    build: {
      rollupOptions: {
        input: {
          browser: resolve(__dirname, 'src/renderer/index.html'),
          webview: resolve(__dirname, 'src/renderer/overlay.html'),
          webviewfull: resolve(__dirname, 'src/renderer/overlayfull.html'),
          icon: resolve(__dirname, 'src/renderer/assets/icon.png'),
        }
      }
    }
  }
  // build: {
  //   outDir,
  //   emptyOutDir: true
  // }
})
