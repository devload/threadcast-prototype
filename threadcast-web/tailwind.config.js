/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ThreadCast 테마 색상
        thread: {
          primary: '#6366f1',    // Indigo
          secondary: '#8b5cf6',  // Violet
          success: '#22c55e',    // Green (Woven)
          warning: '#f59e0b',    // Amber (Threading)
          danger: '#ef4444',     // Red (Tangled)
          muted: '#64748b',      // Slate
        }
      }
    },
  },
  plugins: [],
}
