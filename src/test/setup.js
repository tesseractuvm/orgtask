import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * Las pruebas de recorrido completo encadenan varias esperas (ingreso, carga del
 * tablero, guardado). Con el límite por defecto de 1 segundo fallaban cuando la
 * máquina estaba ocupada corriendo el resto de la suite en paralelo, que es un
 * fallo por lentitud y no por un defecto de la aplicación.
 */
configure({ asyncUtilTimeout: 5000 });

/**
 * Node 26 trae su propio `localStorage` global que queda deshabilitado si el
 * proceso no arranca con --localstorage-file. Ese global tapa el que jsdom
 * instala, así que durante las pruebas el almacén del navegador no existía y
 * cualquier pantalla que lo tocara fallaba.
 *
 * Aquí se repone un almacén en memoria con la misma interfaz. Las pruebas pasan
 * por el mismo camino que el navegador real en vez de por un atajo.
 */
if (!globalThis.localStorage) {
  const datos = new Map();

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (clave) => (datos.has(String(clave)) ? datos.get(String(clave)) : null),
      setItem: (clave, valor) => datos.set(String(clave), String(valor)),
      removeItem: (clave) => void datos.delete(String(clave)),
      clear: () => datos.clear(),
      key: (indice) => [...datos.keys()][indice] ?? null,
      get length() {
        return datos.size;
      },
    },
  });
}

afterEach(() => {
  cleanup();
});
