# Account Express - Guía de Despliegue (Production Ready)

## 📋 Requisitos Previos

- Docker & Docker Compose
- Node.js 20+ (Opcional, para scripts locales)
- 500MB RAM mínimo disponible

## 🚀 Despliegue Rápido (Docker)

El sistema está contenerizado para un despliegue "Zero-Config" usando Nginx como servidor estático de alto rendimiento.

1. **Clonar el repositorio:**

   ```bash
   git clone <repo_url>
   cd "Account Express"
   ```

2. **Verificar Variables de Entorno:**
   El archivo `.env.production` ya está pre-configurado:

   ```env
   VITE_APP_ENV=production
   VITE_ENABLE_FORENSIC=true
   ```

3. **Iniciar el Sistema:**

   ```bash
   docker-compose up --build -d
   ```

   *Esto compilará la aplicación y lanzará el servidor en el puerto 3000.*

4. **Acceso:**
   Abrir `http://localhost:3000`

## 🛠 Comandos de Mantenimiento

- **Ver logs:** `docker-compose logs -f`
- **Reiniciar:** `docker-compose restart`
- **Actualizar:** `git pull && docker-compose up --build -d`

## 🧪 Validación Post-Deploy

1. Verificar que el Dashboard muestre "Radar de Obligaciones" y "Historial".
2. Confirmar que el pie de página indique "Verificado por Iron Core".
3. Generar un reporte DR-15 de prueba para confirmar librerías gráficas (PDF).

## 📂 Estructura de Persistencia

La base de datos SQLite se gestiona localmente en el navegador (OPFS) para garantizar disponibilidad Offline-First.
Si se requiere backup centralizado, configurar el servicio `db_sync` en `docker-compose.yml`.
