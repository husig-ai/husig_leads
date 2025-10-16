/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // HuSig Brand Colors
        'husig-purple': {
          50: 'hsl(245, 85%, 97%)',
          100: 'hsl(244, 75%, 93%)',
          200: 'hsl(244, 68%, 86%)',
          300: 'hsl(244, 62%, 76%)',
          400: 'hsl(244, 58%, 65%)',
          500: 'hsl(263, 70%, 50%)', // Main purple
          600: 'hsl(263, 70%, 45%)',
          700: 'hsl(263, 70%, 40%)',
          800: 'hsl(263, 70%, 35%)',
          900: 'hsl(263, 70%, 30%)',
        },
        'husig-blue': {
          50: 'hsl(198, 100%, 97%)',
          100: 'hsl(198, 100%, 93%)',
          200: 'hsl(198, 100%, 86%)',
          300: 'hsl(198, 93%, 76%)',
          400: 'hsl(198, 89%, 65%)',
          500: 'hsl(198, 88%, 48%)', // Main blue
          600: 'hsl(198, 88%, 43%)',
          700: 'hsl(198, 88%, 38%)',
          800: 'hsl(198, 88%, 33%)',
          900: 'hsl(198, 88%, 28%)',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)" 
          },
          "50%": { 
            boxShadow: "0 0 30px rgba(139, 92, 246, 0.8)" 
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      boxShadow: {
        'husig': '0 10px 25px -3px rgba(139, 92, 246, 0.1), 0 4px 6px -2px rgba(139, 92, 246, 0.05)',
        'husig-lg': '0 20px 40px -12px rgba(139, 92, 246, 0.25), 0 8px 16px -4px rgba(139, 92, 246, 0.1)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.5)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.5)',
      },
      backgroundImage: {
        'husig-gradient': 'linear-gradient(135deg, hsl(198, 88%, 48%) 0%, hsl(263, 70%, 50%) 100%)',
        'husig-gradient-subtle': 'linear-gradient(135deg, hsl(240, 10%, 8%) 0%, hsl(240, 10%, 12%) 100%)',
        'husig-dark': 'linear-gradient(135deg, hsl(240, 10%, 3%) 0%, hsl(245, 15%, 8%) 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}