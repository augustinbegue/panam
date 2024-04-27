/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        parisine: ['parisine-std', 'sans-serif'],
      },
      colors: {
        ratpYellow: '#FFCD00',
      }
    },
  },
  plugins: [],
}

