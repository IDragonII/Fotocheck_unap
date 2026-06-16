# Sistema Fotocheck - Universidad Nacional del Altiplano

Sistema web para la gestion de fotochecks institucionales de la Universidad Nacional del Altiplano, Puno. Permite importar trabajadores desde Excel, generar fotochecks con codigos QR unicos y visualizarlos en un visor web con diseno institucional.

---

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Backend | Laravel 13 (PHP 8.3) |
| Frontend | React 19 + Vite 8 |
| Base de Datos | MySQL (MariaDB) |
| Servidor Local | XAMPP (Apache puerto 80) |
| Documentacion | LaTeX (pdfLaTeX) |

---

## Estructura del Proyecto

```
fotocheck-project/
├── backend/                    # API REST Laravel
│   ├── app/
│   │   ├── Http/Controllers/   # Controladores API
│   │   ├── Models/             # Modelos Eloquent
│   │   └── Traits/             # Loggable (auditoria)
│   ├── database/migrations/    # Migraciones MySQL
│   └── routes/api.php          # Rutas API
├── frontend/                   # SPA React
│   ├── src/
│   │   ├── pages/              # Vistas (Dashboard, Trabajadores, etc.)
│   │   ├── services/api.js     # Cliente HTTP
│   │   └── assets/             # Logo, firma
│   └── public/                 # Favicon
├── CREDENCIALES.txt            # Credenciales de acceso
└── README.md
```

---

## Modulos del Sistema

### 1. Dashboard
- Estadisticas generales: trabajadores, fotochecks, usuarios, accesos QR
- 5 graficos dinamicos con porcentajes:
  - Distribucion de Personal: Administrativos vs Docentes
  - Fotos: Presencial vs Digital
  - Disponibilidad de Fotografia por Tipo
  - Distribucion por Condicion Laboral (barras)
  - Integridad de la Informacion de Contacto

### 2. Gestion de Trabajadores
- CRUD completo de trabajadores
- Importacion masiva desde Excel (.xlsx/.xls/.csv)
- Descarga de plantilla Excel con formato esperado
- Columnas importadas: DNI, Nombres, Apellidos, Correo, Telefono, Condicion, Codigo Unico, Codigo NFS, URL Foto Presencial, URL Foto Virtual, URL QR Image, URL QR
- Busqueda por nombre, apellido o DNI
- Paginacion de 15 registros

### 3. Generacion de Fotochecks
- Generacion automatica de fotochecks para trabajadores activos sin fotocheck vigente
- Codigo unico por fotocheck (formato FC-XXXXXXXX)
- Estados: VIGENTE, ANULADO
- Busqueda por nombre o DNI del trabajador

### 4. Visualizador Publico de Fotochecks
- URL publica: `{dominio}/{codigo_unico}` (sin autenticacion)
- Tarjeta CSS con efecto flip (anverso/reverso)
- **Anverso**: Logo universidad, foto del trabajador, nombre, cargo, NFC, codigo
- **Reverso**: Datos complementarios (contacto, informacion laboral, firma autorizada)
- Proxy de imagenes para Google Drive
- Registro de accesos QR (IP, navegador, fecha)
- Rate limiting: 30 req/min

### 5. Usuarios y Seguridad
- CRUD de usuarios con roles
- Bloqueo de cuenta: 5 intentos fallidos = 15 min de bloqueo
- Expiracion de sesion configurable (default 120 min)
- Rate limiting: Login 5/min, API 60/min
- Headers de seguridad: HSTS, X-Frame-Options DENY, nosniff, XSS protection
- Auditors automatica via trait Loggable

### 6. Roles y Permisos
- Roles: SUPER_ADMIN, ADMIN, OPERADOR, CONSULTOR, EDITOR
- Sistema de permisos por modulo
- Asignacion de multiples roles por usuario

### 7. Logs de Auditoria
- Registro automatico de acciones: Creacion, Actualizacion, Eliminacion, Importacion, etc.
- Filtros por accion, tabla, usuario
- Paginacion de 50 registros

### 8. Accesos QR
- Registro de escaneos de QR
- Datos capturados: IP, navegador, fecha/hora
- Historial por trabajador

---

## Base de Datos

### Tablas Principales

| Tabla | Descripcion |
|-------|-------------|
| `trabajadores` | Datos de los trabajadores universitarios |
| `fotochecks` | Fotochecks generados con codigo y estado |
| `usuarios` | Usuarios del sistema con contrasehas |
| `roles` | Roles del sistema |
| `permisos` | Permisos granulares |
| `usuario_rol` | Relacion usuario-rol |
| `rol_permiso` | Relacion rol-permiso |
| `accesos_qr` | Registro de escaneos QR |
| `logs` | Auditoria del sistema |
| `cache` | Cache y sesiones |

### Columnas Clave de `trabajadores`

- `dni` (8 digitos, unico)
- `codigo_unico` (VARCHAR 50, unico) - Codigo para URL publica
- `codigo_nfs` - Codigo NFC/NFS
- `url_foto_presencial` - URL foto presencial (Google Drive)
- `url_foto_virtual` - URL foto virtual (Google Drive)
- `url_qr_image` - URL imagen QR
- `url_qr` - URL QR

---

## Credenciales por Defecto

| Rol | Usuario | Contrasena |
|-----|---------|------------|
| SUPER_ADMIN | `admin.una` | `Un@Adm!n2026#Seg` |
| ADMIN | `rrhh.una` | `Rrhh@Una!2026$Pro` |
| OPERADOR | `ti.una` | `T1@Sist3ma!2026&` |
| CONSULTOR | `consultor.una` | `C0nsult0r!Una#26` |
| EDITOR | `editor.una` | `Ed1t0r!Una@2026$` |

> **Nota**: Las credenciales completas estan en `CREDENCIALES.txt` (no commitear al repositorio).

---

## Instalacion

### Requisitos
- PHP 8.3+
- Composer
- Node.js 18+
- MySQL/MariaDB
- XAMPP (o similar)

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-repositorio>
cd fotocheck-project

# 2. Configurar backend
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed

# 3. Configurar frontend
cd ../frontend
npm install
npm run build

# 4. Iniciar servidores
cd ../backend
composer dev    # Inicia artisan serve + queue + vite
```

### Configuracion XAMPP
- Apache en puerto 80
- MySQL en puerto 3306
- Base de datos: `sistema_fotocheck`
- Usuario: `root`, sin contrasena

---

## Comandos Disponibles

### Backend (`/backend`)
```bash
composer setup        # Instalacion completa
composer dev          # Servidor de desarrollo concurrente
composer test         # Ejecutar pruebas
php artisan migrate   # Ejecutar migraciones
php artisan test      # PHPUnit tests
./vendor/bin/pint     # Formateo de codigo (Laravel Pint)
```

### Frontend (`/frontend`)
```bash
npm run dev      # Servidor de desarrollo Vite
npm run build    # Build de produccion
npm run lint     # ESLint
npm run preview  # Preview de produccion
```

---

## API Endpoints

### Publicos (sin autenticacion)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/login` | Iniciar sesion |
| GET | `/api/public/fotocheck/{codigo}` | Obtener fotocheck por codigo unico |
| GET | `/api/proxy/image/{url}` | Proxy de imagenes (Google Drive) |

### Protegidos (requiere sesion)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/dashboard` | Estadisticas del dashboard |
| GET/POST | `/api/trabajadores` | Listar/crear trabajadores |
| PUT/DELETE | `/api/trabajadores/{id}` | Actualizar/eliminar trabajador |
| GET | `/api/trabajadores/plantilla` | Descargar plantilla Excel |
| POST | `/api/trabajadores/importar` | Importar desde Excel |
| GET/POST | `/api/fotochecks` | Listar/crear fotochecks |
| DELETE | `/api/fotochecks/{id}` | Anular fotocheck |
| POST | `/api/fotochecks/generar` | Generar fotochecks masivos |
| GET/POST | `/api/usuarios` | Listar/crear usuarios |
| GET/POST | `/api/roles` | Listar/crear roles |
| GET | `/api/logs` | Listar logs de auditoria |
| GET | `/api/accesos-qr` | Listar accesos QR |

---

## Seguridad

- **Autenticacion**: Basada en localStorage (sin tokens JWT/Sanctum)
- **Rate Limiting**: Login 5/min, API 60/min, publico 30/min
- **Bloqueo de cuenta**: 5 intentos fallidos → 15 min bloqueado
- **Headers de seguridad**: HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff
- **CORS**: Solo permite `http://localhost:5173`
- **Rate limiting**: Aplicado via middleware `throttle`

---

## Diseno del Fotocheck

### Anverso
- Header blanco con logo universidad y nombre
- Strip azul derecho
- Foto del trabajador centrada
- Nombre en azul, cargo en gris
- Footer gris con icono NFC y codigo

### Reverso
- Header azul "DATOS COMPLEMENTARIOS"
- Seccion Contacto: Email y telefono del trabajador
- Seccion Informacion Laboral: Regimen, Dependencia, Cargo, Fecha de Ingreso
- Firma autorizada con imagen
- Footer: "Propiedad de la Universidad Nacional del Altiplano"

---

## Notas Tecnicas

- **Sin TypeScript**: El frontend usa JSX puro
- **Nombres en espanol**: Tablas, columnas y mensajes en espanol
- **URLs configurables**: Todas las URLs se definen en `.env`
- **Photos via proxy**: Las imagenes de Google Drive se sirven through el backend
- **codigo_unico**: Codigo hex de 8 caracteres por trabajador para URLs publicas (privacidad sobre DNI)
- **Estados de fotocheck**: Solo se verifica `VIGENTE` en la vista publica

---

## Autor

**Ivan Rony Condori Inquilla**
Universidad Nacional del Altiplano - Puno
(051) 363-282 | rrhh@unap.edu.pe
