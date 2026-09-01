/**
 * Sistema de diseno de OrgTask.
 * La paleta y la escala tipografica reemplazan por completo las de Tailwind:
 * si un color o un tamano no esta aqui, no existe en la aplicacion.
 * Esa restriccion es intencional, es lo que mantiene la interfaz coherente.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',

      // Azul marino institucional: barra lateral y titulos de mayor jerarquia
      ink: {
        DEFAULT: '#10233D',
        900: '#0A1729',
        800: '#10233D',
        700: '#1B3556',
        600: '#2A4770',
      },
      // Fondo del lienzo de trabajo
      paper: '#F4F5F7',
      // Tarjetas y superficies elevadas
      surface: {
        DEFAULT: '#FFFFFF',
        muted: '#FAFBFC',
      },
      // Bordes y separadores de columna
      line: {
        DEFAULT: '#DBDFE6',
        strong: '#C3C9D4',
      },
      // Texto secundario, fechas, metadatos
      slate: {
        DEFAULT: '#5A6577',
        light: '#8A93A3',
        dark: '#3C4554',
      },
      // Acento unico de accion: botones primarios y anillo de foco
      signal: {
        DEFAULT: '#0B63CE',
        dark: '#094FA5',
        light: '#E7F0FC',
      },
      // Funcionales: vencimientos, errores y confirmaciones
      alert: {
        DEFAULT: '#B4232A',
        light: '#FBEAEA',
      },
      ok: {
        DEFAULT: '#0E6E52',
        light: '#E6F2EE',
      },
      // Codigo de identificacion de area, no decoracion.
      // El hex aprobado se usa en rellenos solidos; la variante -text es la
      // misma familia oscurecida para alcanzar contraste AA sobre el fondo suave.
      area: {
        cpyg: '#B8701C',
        'cpyg-soft': '#F6EDE1',
        'cpyg-text': '#8F5511',
        ryve: '#1E7A5F',
        'ryve-soft': '#E5F0EC',
        'ryve-text': '#17654E',
        deportes: '#6D4534',
        'deportes-soft': '#F0E8E5',
        'deportes-text': '#6D4534',
      },

      // Color de la persona responsable de la tarea, no del area. El brief lo
      // fija asi: la tarjeta se lee por quien responde por ella.
      //
      // Cada color trae tres variantes con una funcion distinta:
      //   solido  relleno del avatar y de la franja de la tarjeta
      //   -soft   fondo del riel de prioridad, donde va texto oscuro
      //   -text   la misma familia oscurecida, para texto sobre -soft o blanco
      //
      // Todas las combinaciones que llevan texto estan verificadas en AA:
      // los tonos claros (amarillo, rosado, lila) llevan texto ink y el resto
      // texto blanco. Ese dato vive en PERSON_TONES, en src/lib/people.js.
      person: {
        amarillo: '#F2C230',
        'amarillo-soft': '#FBF2DA',
        'amarillo-text': '#7A5B06',
        rosado: '#E8A0B4',
        'rosado-soft': '#FBEBEF',
        'rosado-text': '#9B3350',
        azul: '#1E63C4',
        'azul-soft': '#E4EDFA',
        'azul-text': '#12509F',
        verde: '#1E7A4F',
        'verde-soft': '#E4F1EA',
        'verde-text': '#166043',
        lila: '#9B7BD4',
        'lila-soft': '#F0EAFA',
        'lila-text': '#5F3F9E',
        magenta: '#B5218C',
        'magenta-soft': '#FAE6F4',
        'magenta-text': '#8E1A6D',
        cafe: '#6D4534',
        'cafe-soft': '#F0E8E5',
        'cafe-text': '#5C3A2B',
        gris: '#6B7280',
        'gris-soft': '#EDEFF2',
        'gris-text': '#4B5563',
        calipso: '#0F7C90',
        'calipso-soft': '#E2F2F5',
        'calipso-text': '#0B6675',
        naranjo: '#C2551A',
        'naranjo-soft': '#FAEBE1',
        'naranjo-text': '#9A4314',
      },
    },
    fontFamily: {
      display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
      sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
    },
    // Escala fija de 6 pasos: 14, 16, 20, 28, 40, 64
    fontSize: {
      sm: ['0.875rem', { lineHeight: '1.375rem' }],
      base: ['1rem', { lineHeight: '1.625rem' }],
      lg: ['1.25rem', { lineHeight: '1.75rem' }],
      xl: ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.01em' }],
      '2xl': ['2.5rem', { lineHeight: '2.75rem', letterSpacing: '-0.02em' }],
      '3xl': ['4rem', { lineHeight: '4.25rem', letterSpacing: '-0.03em' }],
    },
    borderRadius: {
      none: '0',
      sm: '2px',
      DEFAULT: '4px',
      md: '6px',
      lg: '8px',
      full: '9999px',
    },
    boxShadow: {
      card: '0 1px 2px rgba(16, 35, 61, 0.06)',
      raised: '0 4px 16px -4px rgba(16, 35, 61, 0.16)',
      none: 'none',
    },
    extend: {
      keyframes: {
        // Unico movimiento orquestado: entrada de columnas y tarjetas
        rise: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        rise: 'rise 320ms cubic-bezier(0.22, 1, 0.36, 1) both',
        spin: 'spin 800ms linear infinite',
      },
    },
  },
  plugins: [],
};
