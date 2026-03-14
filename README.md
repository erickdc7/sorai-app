# 🎬 Sorai — Tu seguimiento personal de anime

Aplicación web fullstack para explorar, buscar y organizar tu lista personal de animes.

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|---|---|
| **Next.js 14** (App Router) | Framework React con renderizado híbrido |
| **TypeScript** | Tipado estático |
| **Tailwind CSS** | Estilos utilitarios |
| **Supabase** | Base de datos PostgreSQL + Autenticación |
| **Jikan API v4** | Datos de anime (MyAnimeList) — sin API key |
| **Lucide React** | Iconos |

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx            # Layout raíz (Inter font + AuthProvider)
│   ├── page.tsx              # Inicio — Popular + En Temporada
│   ├── globals.css           # Tailwind + animaciones
│   ├── search/page.tsx       # Búsqueda con paginación
│   ├── anime/[id]/page.tsx   # Detalle del anime
│   └── my-list/page.tsx      # Lista personal (ruta privada)
├── components/
│   ├── Navbar.tsx             # Barra de navegación
│   ├── AuthModal.tsx          # Modal login/registro
│   ├── AnimeCard.tsx          # Tarjeta de anime
│   ├── AnimeCardSkeleton.tsx  # Skeleton de carga
│   └── DeleteConfirmModal.tsx # Confirmación de eliminación
├── context/
│   └── AuthContext.tsx        # Proveedor de autenticación
├── lib/
│   ├── supabase.ts            # Cliente de Supabase
│   ├── jikan.ts               # Wrapper de Jikan API
│   └── user-anime-list.ts     # CRUD de lista de usuario
└── types/
    └── anime.ts               # Tipos TypeScript
```

---

## 🚀 Cómo ejecutar el proyecto

### Prerrequisitos

- **Node.js** 18 o superior
- **npm** (viene con Node.js)
- Una cuenta en [Supabase](https://supabase.com) (plan gratuito)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

#### 2.1 Crear un proyecto en Supabase

1. Ve a [app.supabase.com](https://app.supabase.com)
2. Crea un nuevo proyecto (o usa uno existente)
3. Espera a que el proyecto se inicialice

#### 2.2 Crear la tabla en la base de datos

1. En tu dashboard de Supabase, ve a **SQL Editor**
2. Copia y pega el contenido de `supabase/schema.sql`
3. Ejecuta el query — esto crea la tabla `user_anime_list` con las políticas RLS

#### 2.3 Desactivar la confirmación de email (IMPORTANTE)

> **⚠️ Sin este paso, el registro no funciona correctamente.** Los usuarios se crean pero no pueden iniciar sesión hasta confirmar su email.

1. En Supabase, ve a **Authentication** → **Providers** → **Email**
2. **Desactiva** la opción **"Confirm email"**
3. Guarda los cambios

Esto permite que los usuarios se registren e inicien sesión inmediatamente sin necesidad de verificar su correo.

#### 2.4 Obtener las credenciales

1. Ve a **Settings** → **API** en tu proyecto de Supabase
2. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Configurar variables de entorno

Edita el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...tu_clave_aqui
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en **http://localhost:3000**

### 5. Build de producción (opcional)

```bash
npm run build
npm start
```

---

## 📄 Páginas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Público | Animes populares y de temporada |
| `/search?q=término` | Público | Búsqueda con paginación |
| `/anime/[id]` | Público | Detalle completo del anime |
| `/my-list` | Privado | Lista personal del usuario |

---

## 🔑 Autenticación

- **Registro**: Email + contraseña + nombre de usuario
- **Login**: Email + contraseña
- Las rutas privadas (`/my-list`) redirigen al inicio si no hay sesión
- El avatar muestra la inicial del username

---

## 📡 APIs externas

### Jikan API v4

- **Base URL**: `https://api.jikan.moe/v4`
- **Autenticación**: Ninguna (API pública gratuita)
- **Rate Limit**: La app maneja errores 429 automáticamente
- **Endpoints usados**:
  - `/top/anime` — Anime populares
  - `/seasons/now` — Anime de la temporada
  - `/anime?q=` — Búsqueda
  - `/anime/{id}/full` — Detalle completo
  - `/anime/{id}/characters` — Personajes
  - `/anime/{id}/episodes` — Episodios

---

## 🗄️ Base de datos

Una sola tabla `user_anime_list` con Row Level Security (RLS):

```sql
user_anime_list
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── mal_id (INTEGER)
├── status (TEXT: watching|completed|paused|dropped|planned)
├── score (INTEGER, 1-10, nullable)
├── anime_title (TEXT)
├── anime_image_url (TEXT)
├── anime_year (INTEGER)
├── anime_type (TEXT)
└── created_at (TIMESTAMP)
```

Las políticas RLS aseguran que cada usuario solo puede ver y modificar sus propios registros.

---

## ❓ Troubleshooting

| Problema | Solución |
|---|---|
| "Invalid supabaseUrl" | Verifica que `.env.local` tiene URLs válidas (`https://...`) |
| No puedo iniciar sesión tras registrarme | Desactiva "Confirm email" en Supabase Authentication → Email |
| Las imágenes no cargan | Verifica conexión a internet (las imágenes vienen de `cdn.myanimelist.net`) |
| Error 429 en la API | Espera unos segundos y recarga — Jikan tiene rate limiting |
| Puerto 3000 ocupado | Next.js usará automáticamente el 3001 |
