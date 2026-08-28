Instrucciones para el agente de IA en este proyecto. Léelas completas antes de escribir código. Si una instrucción del usuario contradice este archivo, gana el usuario, pero avísale del conflicto.
1. Contexto del proyecto
Aplicación web frontend construida sin escribir código a mano. El usuario dirige, tú construyes.
Stack: React 18+ con Vite, Tailwind CSS 3+, JavaScript (no TypeScript salvo que el usuario lo pida).
Entorno: desarrollo local en `localhost`. No configures despliegue, dominios ni backend salvo instrucción explícita.
El usuario puede no ser programador. Explica cada decisión técnica en 1 o 2 frases en español simple antes de ejecutarla.
2. Idioma y comunicación
Responde siempre en español.
Todo el texto visible de la interfaz (botones, títulos, mensajes de error, estados vacíos) va en español, salvo que el usuario indique otro idioma.
Los nombres de archivos, componentes, variables y funciones van en inglés, siguiendo la convención estándar de React.
Nunca uses jerga sin explicarla la primera vez. Ejemplo: “Voy a crear un componente (una pieza reutilizable de la interfaz) llamado Navbar”.
3. Configuración inicial
Cuando el proyecto parte de cero:
```bash
npm create vite@latest nombre-proyecto -- --template react
cd nombre-proyecto
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm run dev
```
Configura `tailwind.config.js` con `content: ["./index.html", "./src/**/*.{js,jsx}"]`.
Agrega las 3 directivas de Tailwind a `src/index.css`.
Verifica que `npm run dev` levante en `http://localhost:5173` antes de construir nada más.
Después de cada cambio significativo, confirma que el servidor sigue corriendo sin errores en consola.
4. Estructura de archivos
```
src/
  components/     Componentes reutilizables (Button.jsx, Card.jsx, Navbar.jsx)
  pages/          Vistas completas (Home.jsx, About.jsx)
  assets/         Imágenes, íconos, fuentes locales
  hooks/          Hooks personalizados si se necesitan
  App.jsx         Composición principal
  index.css       Tailwind y estilos base
```
Un componente por archivo. Nombre del archivo igual al nombre del componente.
Componentes de menos de 150 líneas. Si crece más, divídelo.
No instales librerías de componentes (shadcn, MUI, Chakra, DaisyUI) salvo que el usuario lo pida. El diseño se construye con Tailwind puro. Esa es la razón principal por la que el resultado no se ve genérico.
5. Sistema de diseño: reglas duras
Esta sección es la más importante del archivo. El objetivo es que la interfaz parezca diseñada por un estudio, no generada por una plantilla.
5.1 Antes de escribir código
Antes de construir cualquier pantalla, define y muestra al usuario un mini sistema de diseño:
Paleta: 4 a 6 colores con hex, cada uno con nombre y función (fondo, texto, acento, borde, superficie).
Tipografía: 2 fuentes con roles claros. Una display con carácter para títulos, una de lectura para el cuerpo. Cárgalas desde Google Fonts en `index.html`.
Concepto de layout: 1 frase que describa la estructura de la página.
Elemento firma: el único detalle memorable de esta interfaz (un tratamiento tipográfico, una interacción, una forma de mostrar los datos). Uno solo.
Espera la aprobación del usuario antes de construir. Si el usuario dice “hazlo tú”, decide y explica por qué.
5.2 Prohibiciones (esto es lo que delata a la IA)
Prohibido el gradiente violeta a azul, el violeta a rosado y cualquier gradiente como protagonista del hero.
Prohibida la combinación fondo crema + serif de alto contraste + acento terracota. Es el cliché número 1 de diseño generado por IA en 2025 y 2026.
Prohibido el fondo casi negro con un solo acento verde ácido o naranja neón, salvo que el rubro lo justifique y el usuario lo apruebe.
Prohibido usar Inter, Roboto o la fuente por defecto del sistema para los títulos. Para el cuerpo, Inter se permite solo si la display tiene carácter propio.
Prohibidos los emojis como íconos de la interfaz. Usa SVG (Lucide o Heroicons como paquete de íconos está permitido).
Prohibido el texto de relleno tipo “Lorem ipsum” o “Potencia tu negocio con soluciones innovadoras”. Todo el copy debe ser concreto y específico al proyecto. Si falta información, pregunta al usuario qué hace el producto y para quién.
Prohibidas las tarjetas con sombra genérica, borde redondeado xl y un ícono centrado arriba, repetidas 3 veces en una grilla. Si necesitas mostrar 3 características, busca otra estructura: lista numerada con jerarquía, filas alternadas, tabla editorial.
Prohibido animar todo. Máximo 1 momento de movimiento orquestado por página (una entrada, un hover con intención). Respeta `prefers-reduced-motion`.
Prohibidos los badges tipo “✨ Nuevo” o “🚀 Impulsado por IA” en el hero.
5.3 Obligaciones
Escala tipográfica definida y consistente: define tamaños en el config de Tailwind o usa una escala fija (por ejemplo 14, 16, 20, 28, 40, 64) y no te salgas de ella.
Espaciado con ritmo: múltiplos de 4 u 8. El aire entre secciones comunica jerarquía.
Contraste AA mínimo entre texto y fondo. Verifica los grises sobre fondos de color.
Estados completos en todo elemento interactivo: hover, focus visible, disabled, loading cuando aplique.
Responsive real: diseña mobile primero, verifica en 375px, 768px y 1280px.
Los botones dicen exactamente lo que hacen: “Guardar cambios”, no “Enviar”. Voz activa en todo el copy.
El hero abre con lo más característico del producto, no con una frase genérica. Si el producto muestra datos, muestra datos reales o realistas desde el primer pantallazo.
5.4 Autocrítica obligatoria
Después de construir cada pantalla, revisa contra esta lista y corrige antes de mostrar:
¿Podría esta pantalla pertenecer a cualquier otro producto? Si sí, falta especificidad.
¿Hay más de 1 elemento compitiendo por ser el protagonista? Quita uno.
¿El copy podría haberlo escrito una plantilla? Reescríbelo con el contenido real del proyecto.
¿Usé alguna de las prohibiciones de 5.2? Corrígelo sin que el usuario lo pida.
6. Convenciones de código
Componentes funcionales con hooks. Nada de clases.
Props desestructuradas en la firma del componente.
Clases de Tailwind directamente en el JSX. No crees archivos CSS adicionales salvo para animaciones con keyframes.
Estado local con `useState`. Estado compartido con props o context. No instales Redux ni Zustand salvo pedido explícito.
Datos de ejemplo en un archivo `src/data/` separado, nunca hardcodeados dentro del JSX.
Sin `console.log` en el código final.
Comenta solo lo que no es obvio, en español.
7. Flujo de trabajo
Entiende el pedido. Si es ambiguo, haz máximo 2 preguntas antes de construir.
Propón el plan en 3 a 5 pasos y el sistema de diseño (sección 5.1).
Construye por partes: primero la estructura, luego el estilo, luego las interacciones.
Después de cada parte, indica al usuario qué revisar en el navegador y qué debería ver.
Si algo falla, lee el error completo de la consola antes de intentar arreglos. Explica la causa en 1 frase.
Nunca borres trabajo existente para “empezar de nuevo” sin confirmación del usuario.
8. Qué no hacer
No agregues funcionalidades que el usuario no pidió.
No cambies el stack (no migres a Next.js, no agregues TypeScript, no cambies Tailwind por CSS modules) por iniciativa propia.
No toques archivos de configuración que ya funcionan salvo necesidad concreta.
No generes más de 1 pantalla por iteración sin aprobación.
No uses datos personales reales en los ejemplos.
9. Control de versiones
Ejecuta `git init` al crear el proyecto y haz el primer commit apenas `npm run dev` funcione.
Un commit por cada funcionalidad que quede operativa, con mensaje descriptivo en español: “Agrega navbar responsive”, no “cambios”.
Antes de una modificación grande o riesgosa, haz commit del estado actual. Es la red de seguridad del usuario.
Nunca ejecutes `git push --force`, nunca borres la carpeta `.git` y nunca hagas `git reset --hard` sin confirmación explícita del usuario.
Si el usuario quiere volver atrás, muéstrale los últimos 5 commits con `git log --oneline -5` y explícale a cuál conviene volver y por qué.
10. Cuando algo falla y no sale
Máximo 3 intentos para el mismo error. Si al tercer intento persiste, detente, resume qué probaste y qué sospechas, y pide al usuario el error completo de la consola del navegador o una captura.
No reescribas un archivo completo para arreglar un bug puntual. Localiza la causa y haz el cambio mínimo.
Si el error viene de una dependencia, verifica la versión instalada en `package.json` antes de asumir la sintaxis de la documentación.
Nunca declares algo arreglado sin verificarlo. Indica al usuario exactamente qué debería ver en el navegador para confirmar.
11. Datos, persistencia y claves
No hay backend. Los datos viven en archivos de `src/data/` con contenido realista y en español.
Si el usuario necesita que los datos sobrevivan al recargar la página, usa `localStorage` y adviértele que solo persiste en su navegador y su máquina.
Prohibido poner claves de API dentro del código frontend. Si una integración requiere clave, explícale al usuario que en frontend la clave queda expuesta y que eso se resuelve con un backend, fuera del alcance actual del proyecto.
Si se usa un archivo `.env`, agrégalo a `.gitignore` en el mismo paso en que lo creas.
12. Rutas y navegación
Si la aplicación tiene 1 sola vista, no instales router. Usa estado para alternar secciones si hace falta.
Con 2 o más páginas, instala `react-router-dom` y define las rutas en `App.jsx`.
Toda página nueva necesita: entrada en el router, enlace visible en la navegación y un título propio en la pestaña del navegador.
13. Imágenes e íconos
Íconos: `lucide-react`, importados individualmente. Nunca emojis, nunca SVG pegados a mano si existe el ícono en la librería.
Imágenes de relleno: usa servicios de placeholder realistas (por ejemplo `picsum.photos`) o pide al usuario sus imágenes reales. Nada de cajas grises con la palabra “imagen”.
Toda imagen lleva atributo `alt` descriptivo en español.
Imágenes locales van en `src/assets/` y se importan, no se referencian con rutas absolutas.
14. Trabajo con specs (Kiro)
Para funcionalidades de más de 1 pantalla o con lógica no trivial, usa el modo spec en vez de vibe coding directo:
`requirements.md`: qué necesita el usuario, en criterios verificables.
`design.md`: cómo se va a construir, componentes y flujo de datos.
`tasks.md`: pasos ordenados, cada uno completable y verificable por separado.
Ejecuta las tareas de a una y marca el avance. No saltes al paso 5 si el 2 no está verificado.
Si durante la implementación descubres que el diseño estaba mal, actualiza el spec primero y luego el código, para que el documento nunca mienta.
Cambios chicos (ajustar un color, corregir un texto) no necesitan spec. Criterio: si el cambio toca 3 o más archivos, va con spec.
15. Checklist de entrega por pantalla
Antes de dar una pantalla por terminada, verifica los 7 puntos. Si alguno falla, corrige antes de mostrar:
`npm run dev` corre sin errores ni warnings en la consola del navegador.
Se ve bien en 375px, 768px y 1280px.
Todo elemento interactivo tiene hover y focus visible.
El copy es real y específico del proyecto, sin relleno.
Pasó la autocrítica de la sección 5.4.
Las imágenes tienen alt y los íconos vienen de lucide-react.
Hay un commit con el estado funcionando.