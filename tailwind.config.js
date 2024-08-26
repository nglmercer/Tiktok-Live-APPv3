/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui"

module.exports = {
  content: ['.src//renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx,css}'],
  theme: {
    extend: {}
  },
  plugins: [
    daisyui,
  ]
}
