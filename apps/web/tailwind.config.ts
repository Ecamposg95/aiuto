import type { Config } from 'tailwindcss'

/**
 * Sistema de diseño Modernist de AIUTO, tomado de `docs/tokens.json`.
 *
 * La referencia normativa sigue siendo `sitio/ui-kit.html`. Reglas que no se
 * negocian: radio 0, reglas de 2 px, alineación a la izquierda, tipografía
 * Archivo, y el morado como único color de acción — los siete colores de
 * categoría clasifican, no invitan a hacer clic.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    // Reemplazan la escala por defecto de Tailwind: sólo existe lo que el
    // sistema define.
    borderRadius: { none: '0', DEFAULT: '0' },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      off: '#f8f7f7',
      ink: { DEFAULT: '#201e1d', 2: '#57534f' },
      neutral: '#6b6866',
      line: { DEFAULT: '#d6d3d1', soft: '#ecebea' },
      field: '#b8b3b0',
      disabled: '#8a8683',
      purple: {
        DEFAULT: '#572967',
        100: '#f3eff5',
        300: '#cdbcd4',
        700: '#3d1c49',
        900: '#2c1435',
      },
      // Las siete categorías. Se usan como clasificación, nunca como acción.
      estrategia: { DEFAULT: '#66a2ba', dark: '#2f6d86', tint: '#eef4f7' },
      comercial: { DEFAULT: '#c20e59', dark: '#96063f', tint: '#fbeef3' },
      'capital-humano': { DEFAULT: '#7cb39a', dark: '#3f7a5f', tint: '#eef5f1' },
      operaciones: { DEFAULT: '#c21624', dark: '#94101b', tint: '#fbeeef' },
      tecnologia: { DEFAULT: '#572967', dark: '#3d1c49', tint: '#f3eff5' },
      finanzas: { DEFAULT: '#cd5d22', dark: '#9c4415', tint: '#fbf1ea' },
      comex: { DEFAULT: '#158a92', dark: '#0f6a70', tint: '#eaf4f5' },
      // La categoría activa, que se reescribe por CSS en las vistas de detalle.
      cat: {
        DEFAULT: 'var(--cat)',
        dark: 'var(--cat-dark)',
        tint: 'var(--cat-tint)',
      },
    },
    // El grosor de borde no se alimenta de `spacing`: lleva su propia escala.
    // `rule` son las reglas de 2 px que estructuran todo el sistema.
    borderWidth: {
      0: '0',
      px: '1px',
      DEFAULT: '1px',
      rule: '2px',
      4: '4px',
    },
    spacing: {
      0: '0',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '24px',
      6: '32px',
      7: '48px',
      8: '72px',
      px: '1px',
      rule: '2px',
    },
    fontFamily: {
      sans: ['var(--font-archivo)', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['ui-monospace', 'Menlo', 'Consolas', 'monospace'],
    },
    fontSize: {
      display: ['56px', { lineHeight: '1.04', fontWeight: '700', letterSpacing: '-.03em' }],
      h1: ['48px', { lineHeight: '1.06', fontWeight: '700', letterSpacing: '-.03em' }],
      h2: ['30px', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-.025em' }],
      h3: ['21px', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-.015em' }],
      h4: ['16.5px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-.01em' }],
      lead: ['18px', { lineHeight: '1.55' }],
      body: ['16px', { lineHeight: '1.5' }],
      sm: ['14.5px', { lineHeight: '1.45' }],
      label: ['11.5px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '.14em' }],
      mono: ['11px', { lineHeight: '1.4' }],
      metric: ['44px', { lineHeight: '1', fontWeight: '700', letterSpacing: '-.035em' }],
    },
    boxShadow: {
      md: '0 3px 16px rgba(32,30,29,.10)',
      lg: '0 6px 26px rgba(32,30,29,.20)',
      none: 'none',
    },
    extend: {
      maxWidth: { wrap: '1240px' },
      transitionDuration: { DEFAULT: '180ms' },
      transitionTimingFunction: { DEFAULT: 'ease-out' },
      screens: { sm: '640px', md: '768px', lg: '900px', xl: '1024px', '2xl': '1440px' },
    },
  },
  plugins: [],
}

export default config
