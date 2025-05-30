import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  safelist: [
    // Border colors for orbit elements
    { pattern: /border-(green|yellow|blue|purple|pink|orange|emerald|red|cyan|indigo|amber|rose|lime|teal|violet|fuchsia|sky|stone)-500\/30/ },
    // Text colors for orbit elements
    { pattern: /text-(green|yellow|blue|purple|pink|orange|emerald|red|cyan|indigo|amber|rose|lime|teal|violet|fuchsia|sky|stone)-400/ },
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        'orbit1': 'orbit1 20s linear infinite',
        'orbit2': 'orbit2 22s linear infinite',
        'orbit3': 'orbit3 24s linear infinite',
        'orbit4': 'orbit4 26s linear infinite',
        'orbit5': 'orbit5 28s linear infinite',
        'orbit6': 'orbit6 30s linear infinite',
        'orbit7': 'orbit7 15s linear infinite',
        'orbit8': 'orbit8 16s linear infinite',
        'orbit9': 'orbit9 17s linear infinite',
        'orbit10': 'orbit10 18s linear infinite',
        'orbit11': 'orbit11 19s linear infinite',
        'orbit12': 'orbit12 20s linear infinite',
        'orbit13': 'orbit13 28s linear infinite reverse',
        'orbit14': 'orbit14 29s linear infinite reverse',
        'orbit15': 'orbit15 30s linear infinite reverse',
        'orbit16': 'orbit16 31s linear infinite reverse',
        'orbit17': 'orbit17 32s linear infinite reverse',
        'orbit18': 'orbit18 33s linear infinite reverse',
        'orbit19': 'orbit19 35s linear infinite',
        'orbit20': 'orbit20 37s linear infinite',
        'orbit21': 'orbit21 39s linear infinite',
        'orbit22': 'orbit22 41s linear infinite',
        'orbit23': 'orbit23 43s linear infinite',
        'orbit24': 'orbit24 45s linear infinite',
        'pulse': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        orbit1: {
          '0%': { transform: 'rotate(0deg) translateX(200px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(200px) rotate(-360deg)' },
        },
        orbit2: {
          '0%': { transform: 'rotate(15deg) translateX(240px) rotate(-15deg)' },
          '100%': { transform: 'rotate(375deg) translateX(240px) rotate(-375deg)' },
        },
        orbit3: {
          '0%': { transform: 'rotate(30deg) translateX(280px) rotate(-30deg)' },
          '100%': { transform: 'rotate(390deg) translateX(280px) rotate(-390deg)' },
        },
        orbit4: {
          '0%': { transform: 'rotate(45deg) translateX(320px) rotate(-45deg)' },
          '100%': { transform: 'rotate(405deg) translateX(320px) rotate(-405deg)' },
        },
        orbit5: {
          '0%': { transform: 'rotate(60deg) translateX(240px) rotate(-60deg)' },
          '100%': { transform: 'rotate(420deg) translateX(240px) rotate(-420deg)' },
        },
        orbit6: {
          '0%': { transform: 'rotate(75deg) translateX(320px) rotate(-75deg)' },
          '100%': { transform: 'rotate(435deg) translateX(320px) rotate(-435deg)' },
        },
        orbit7: {
          '0%': { transform: 'rotate(90deg) translateX(280px) rotate(-90deg)' },
          '100%': { transform: 'rotate(450deg) translateX(280px) rotate(-450deg)' },
        },
        orbit8: {
          '0%': { transform: 'rotate(105deg) translateX(360px) rotate(-105deg)' },
          '100%': { transform: 'rotate(465deg) translateX(360px) rotate(-465deg)' },
        },
        orbit9: {
          '0%': { transform: 'rotate(120deg) translateX(280px) rotate(-120deg)' },
          '100%': { transform: 'rotate(480deg) translateX(280px) rotate(-480deg)' },
        },
        orbit10: {
          '0%': { transform: 'rotate(135deg) translateX(380px) rotate(-135deg)' },
          '100%': { transform: 'rotate(495deg) translateX(380px) rotate(-495deg)' },
        },
        orbit11: {
          '0%': { transform: 'rotate(150deg) translateX(260px) rotate(-150deg)' },
          '100%': { transform: 'rotate(510deg) translateX(260px) rotate(-510deg)' },
        },
        orbit12: {
          '0%': { transform: 'rotate(165deg) translateX(340px) rotate(-165deg)' },
          '100%': { transform: 'rotate(525deg) translateX(340px) rotate(-525deg)' },
        },
        orbit13: {
          '0%': { transform: 'rotate(180deg) translateX(450px) rotate(-180deg)' },
          '100%': { transform: 'rotate(540deg) translateX(450px) rotate(-540deg)' },
        },
        orbit14: {
          '0%': { transform: 'rotate(195deg) translateX(540px) rotate(-195deg)' },
          '100%': { transform: 'rotate(555deg) translateX(540px) rotate(-555deg)' },
        },
        orbit15: {
          '0%': { transform: 'rotate(210deg) translateX(420px) rotate(-210deg)' },
          '100%': { transform: 'rotate(570deg) translateX(420px) rotate(-570deg)' },
        },
        orbit16: {
          '0%': { transform: 'rotate(225deg) translateX(570px) rotate(-225deg)' },
          '100%': { transform: 'rotate(585deg) translateX(570px) rotate(-585deg)' },
        },
        orbit17: {
          '0%': { transform: 'rotate(240deg) translateX(450px) rotate(-240deg)' },
          '100%': { transform: 'rotate(600deg) translateX(450px) rotate(-600deg)' },
        },
        orbit18: {
          '0%': { transform: 'rotate(255deg) translateX(480px) rotate(-255deg)' },
          '100%': { transform: 'rotate(615deg) translateX(480px) rotate(-615deg)' },
        },
        orbit19: {
          '0%': { transform: 'rotate(270deg) translateX(390px) rotate(-270deg)' },
          '100%': { transform: 'rotate(630deg) translateX(390px) rotate(-630deg)' },
        },
        orbit20: {
          '0%': { transform: 'rotate(285deg) translateX(510px) rotate(-285deg)' },
          '100%': { transform: 'rotate(645deg) translateX(510px) rotate(-645deg)' },
        },
        orbit21: {
          '0%': { transform: 'rotate(300deg) translateX(420px) rotate(-300deg)' },
          '100%': { transform: 'rotate(660deg) translateX(420px) rotate(-660deg)' },
        },
        orbit22: {
          '0%': { transform: 'rotate(315deg) translateX(540px) rotate(-315deg)' },
          '100%': { transform: 'rotate(675deg) translateX(540px) rotate(-675deg)' },
        },
        orbit23: {
          '0%': { transform: 'rotate(330deg) translateX(480px) rotate(-330deg)' },
          '100%': { transform: 'rotate(690deg) translateX(480px) rotate(-690deg)' },
        },
        orbit24: {
          '0%': { transform: 'rotate(345deg) translateX(360px) rotate(-345deg)' },
          '100%': { transform: 'rotate(705deg) translateX(360px) rotate(-705deg)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
