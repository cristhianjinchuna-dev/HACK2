# Log Pose Console — Hackathon One Piece

Consola en React + TypeScript para la Guild de Cazarrecompensas: carteles de "Se Busca",
noticias del mundo y la Gran Saga del Grand Line.

## Integrantes

| Nombre | Código |
|:-------|:-------|
| Cristhian Gabriel Jinchuña Cama | 202520002 |
| Mathius Quispe Sicha | 202520058 |
| Eduardo Vila Castellares | 202520004 |

**Tripulación:** Viborex · **Código de equipo:** TEAM-007

## Requisitos

- Node 24 LTS
- npm

## Cómo ejecutar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción
```

## Variables de entorno

Crear un archivo `.env` en la raíz:

```properties
VITE_API_BASE_URL=https://logpose-api-jg7f.onrender.com/api/v1
```

La app lee la URL base solo desde esa variable.

## Stack

React · TypeScript estricto · Vite · React Router · Tailwind CSS · Axios

## Estructura

```
src/
  api.ts                 instancia de Axios, interceptores, errores y getPaginated
  types.ts               tipos del contrato (Swagger)
  services/              consultas al backend (auth, dashboard, wanted, news, sagas)
  auth/                  AuthContext (sesión) y ProtectedRoute (rutas privadas)
  components/            Layout y SearchInput (búsqueda con debounce)
  pages/                 pantallas de cada checkpoint
  story/                 View Transitions y posiciones del mapa de la saga
```

## Decisiones técnicas

- **Sesión:** el JWT se guarda en `sessionStorage`. Un request interceptor lo envía en cada
  petición y un response interceptor cierra la sesión ante un 401. Al recargar, la sesión se
  valida con `/auth/me` sin mostrar el login.
- **Rutas privadas:** `ProtectedRoute` redirige al login guardando la ruta original para volver
  exactamente ahí.
- **Se Busca:** paginación del servidor; filtros, búsqueda, orden, tamaño y página viven en la
  URL. Búsqueda con debounce de 300 ms. Las respuestas antiguas se cancelan con `AbortController`.
- **Noticias:** infinite scroll por cursor con `IntersectionObserver`, una sola carga en vuelo,
  deduplicación por ID y descarte de respuestas de filtros anteriores. El detalle es una ruta
  hija, así el feed conserva su posición.
- **Saga:** scrollytelling con mapa persistente, etapa activa en la URL (`?stage=`), CSS
  Scroll-driven Animations con fallback, View Transition API con fallback, soporte para
  `prefers-reduced-motion` y navegación por teclado.
