import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Nombres con los que puede llegar la conexion a Supabase.
 *
 * Vite solo entrega al navegador las variables que empiezan con VITE_, asi que
 * si el proyecto se conecto desde el panel de Vercel (que crea SUPABASE_URL y
 * SUPABASE_ANON_KEY, sin ese prefijo), la aplicacion no las ve y arranca en
 * modo local sin decir nada. Aqui se aceptan tambien esos nombres y se
 * reescriben con el prefijo que el navegador si recibe.
 *
 * Solo se aceptan claves publicas. La clave de servicio (service_role,
 * sb_secret_) da acceso total saltandose las politicas RLS y jamas puede
 * terminar dentro del archivo que se descarga el navegador, asi que no aparece
 * en esta lista ni aunque este presente en el entorno.
 */
const NOMBRES_URL = [
  'VITE_SUPABASE_URL',
  'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'PUBLIC_SUPABASE_URL',
];

const NOMBRES_CLAVE = [
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'PUBLIC_SUPABASE_ANON_KEY',
];

/** Quita comillas y espacios que se cuelan al pegar el valor en un panel. */
function limpiar(valor) {
  return String(valor ?? '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .trim();
}

function primeroQueExista(nombres, entorno) {
  for (const nombre of nombres) {
    const valor = limpiar(entorno[nombre]);
    if (valor) return { nombre, valor };
  }
  return { nombre: null, valor: '' };
}

/**
 * Sirve las funciones de la carpeta `api/` durante `npm run dev`.
 *
 * En Vercel esas funciones existen solas. El servidor de desarrollo de Vite solo
 * sirve archivos estáticos, así que sin esto la administración de usuarios
 * funcionaría en producción y no en local, que es la peor combinación posible
 * para darse cuenta de un error.
 */
function funcionesApiEnDesarrollo(entorno) {
  return {
    name: 'orgtask-api-dev',
    apply: 'serve',
    configureServer(server) {
      // Las funciones leen sus variables de process.env, igual que en Vercel.
      // Se pasan todos los nombres posibles y la funcion elige el que exista.
      const nombresDeServidor = [
        'SUPABASE_URL',
        'VITE_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_SECRET_KEY',
        'SUPABASE_SERVICE_KEY',
      ];
      for (const nombre of nombresDeServidor) {
        if (!process.env[nombre] && entorno[nombre]) {
          process.env[nombre] = limpiar(entorno[nombre]);
        }
      }

      server.middlewares.use('/api/admin-users', async (req, res, next) => {
        try {
          const modulo = await server.ssrLoadModule('/api/admin-users.js');
          await modulo.default(req, res);
        } catch (error) {
          server.config.logger.error(`[api/admin-users] ${error.message}`);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: error.message }));
          } else {
            next(error);
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode, command }) => {
  // El '' final hace que se lean todas las variables, no solo las VITE_
  const entorno = { ...loadEnv(mode, process.cwd(), ''), ...process.env };

  const url = primeroQueExista(NOMBRES_URL, entorno);
  const clave = primeroQueExista(NOMBRES_CLAVE, entorno);

  // Por seguridad: una clave de servicio nunca puede viajar al navegador
  const pareceSecreta = /sb_secret_|service_role/i.test(clave.valor);
  const claveFinal = pareceSecreta ? '' : clave.valor;

  // Cualquier variable con prefijo VITE_ puede terminar dentro del archivo que
  // descarga el navegador: basta con que una linea del codigo la nombre. Una
  // clave de servicio ahi es acceso total a la base para cualquiera que abra la
  // pagina, asi que si aparece una, se avisa fuerte aunque hoy no se use.
  const secretasExpuestas = Object.entries(entorno)
    .filter(
      ([nombre, valor]) =>
        nombre.startsWith('VITE_') && /sb_secret_|service_role/i.test(`${nombre} ${valor}`)
    )
    .map(([nombre]) => nombre);

  if (command === 'build') {
    if (secretasExpuestas.length > 0) {
      console.warn(
        '\n[OrgTask] ATENCION: %s lleva el prefijo VITE_ y parece una clave de servicio.\n' +
          '          Ese prefijo existe para entregarle variables al navegador. La clave de\n' +
          '          servicio se salta todas las politicas RLS: es acceso total a la base.\n' +
          '          Esta compilacion no la incluye, pero borrala de Vercel y rotala en\n' +
          '          Supabase. El frontend nunca la necesita.\n',
        secretasExpuestas.join(', ')
      );
    }
    if (pareceSecreta) {
      console.warn(
        '\n[OrgTask] La clave encontrada en %s parece ser la clave de servicio. ' +
          'No se incluye: esa clave da acceso total y no puede ir al navegador.\n',
        clave.nombre
      );
    }
    if (url.valor && claveFinal) {
      console.log(
        '\n[OrgTask] Compilando con Supabase conectado (%s + %s).\n',
        url.nombre,
        clave.nombre
      );
    } else {
      console.warn(
        '\n[OrgTask] Compilando SIN Supabase: la aplicacion va a funcionar con datos ' +
          'de ejemplo en el navegador y va a rechazar a las personas reales.\n' +
          '          Falta%s%s.\n' +
          '          Ponlas en Vercel > Settings > Environment Variables, marcando\n' +
          '          Production y Preview, y vuelve a desplegar.\n',
        url.valor ? '' : ' VITE_SUPABASE_URL',
        claveFinal ? '' : `${url.valor ? '' : ' y'} VITE_SUPABASE_PUBLISHABLE_KEY`
      );
    }
  }

  return {
    plugins: [react(), funcionesApiEnDesarrollo(entorno)],
    // Se reescriben con el nombre que espera el codigo, venga del nombre que venga
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(url.valor),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(claveFinal),
    },
    server: {
      port: 5173,
    },
    build: {
      rollupOptions: {
        output: {
          // Se separan las librerias grandes en archivos propios: el navegador las
          // guarda en cache y no las vuelve a descargar en cada despliegue.
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      css: false,
      // Las pruebas de recorrido completo encadenan muchas esperas seguidas
      testTimeout: 20000,
    },
  };
});
