# 🚀 GUÍA COMPLETA DE INTEGRACIÓN CON GITHUB

**Versión**: 1.0.1  
**Fecha**: 9 de febrero de 2026  
**Estado**: ✅ LISTO PARA GITHUB

---

## 📋 TABLA DE CONTENIDOS

1. [Pre-requisitos](#pre-requisitos)
2. [Configuración Inicial](#configuración-inicial)
3. [Estructura de Ramas](#estructura-de-ramas)
4. [GitHub Actions](#github-actions)
5. [GitHub Secrets](#github-secrets)
6. [GitHub Pages](#github-pages)
7. [Primer Push](#primer-push)
8. [Workflow de Desarrollo](#workflow-de-desarrollo)
9. [Troubleshooting](#troubleshooting)

---

## 1. PRE-REQUISITOS

### ✅ Software Necesario

- [x] **Git** instalado (https://git-scm.com/download/win)
- [x] **Node.js 18+** instalado
- [x] **Cuenta de GitHub** activa
- [x] **Repositorio GitHub** creado

### ✅ Archivos Críticos Verificados

- [x] `.gitignore` creado y configurado
- [x] `.github/workflows/main.yml` creado
- [x] `setup-git.ps1` disponible
- [x] Documentación completa en `/docs`

---

## 2. CONFIGURACIÓN INICIAL

### Paso 1: Ejecutar Script de Setup

```powershell
# Ejecutar script de configuración
.\setup-git.ps1
```

El script hará:
- ✅ Verificar instalación de Git
- ✅ Inicializar repositorio (si no existe)
- ✅ Configurar usuario y email
- ✅ Configurar remote origin
- ✅ Crear estructura de ramas
- ✅ Verificar archivos sensibles
- ✅ Preparar primer commit

### Paso 2: Configuración Manual (Alternativa)

```bash
# 1. Inicializar repositorio
git init

# 2. Configurar usuario
git config user.name "Tu Nombre"
git config user.email "tu@email.com"

# 3. Agregar remote
git remote add origin https://github.com/TuUsuario/AccountExpress.git

# 4. Crear rama main
git checkout -b main

# 5. Crear rama develop
git checkout -b develop
git checkout main
```

---

## 3. ESTRUCTURA DE RAMAS

### Ramas Principales

```
main (producción)
  ├── develop (desarrollo)
  │   ├── feature/nueva-funcionalidad
  │   ├── bugfix/correccion-error
  │   └── hotfix/parche-urgente
  └── release/v1.0.1
```

### Convenciones de Nombres

| Tipo | Prefijo | Ejemplo |
|------|---------|---------|
| Nueva funcionalidad | `feature/` | `feature/google-drive-sync` |
| Corrección de bug | `bugfix/` | `bugfix/fix-tax-calculation` |
| Parche urgente | `hotfix/` | `hotfix/security-patch` |
| Release | `release/` | `release/v1.0.2` |

### Workflow de Ramas

```bash
# Crear feature branch desde develop
git checkout develop
git checkout -b feature/nueva-funcionalidad

# Trabajar en la feature
git add .
git commit -m "feat: agregar nueva funcionalidad"

# Merge a develop
git checkout develop
git merge feature/nueva-funcionalidad

# Cuando develop está listo, merge a main
git checkout main
git merge develop

# Tag de release
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin main --tags
```

---

## 4. GITHUB ACTIONS

### Pipeline Automático

**Archivo**: `.github/workflows/main.yml`

#### Jobs Configurados

1. **Validate & Test**
   - Lint code
   - Run tests
   - Build project
   - Upload artifacts

2. **Security Scan**
   - npm audit
   - TruffleHog (secrets detection)

3. **Auto Release** (solo en main)
   - Detecta cambio de versión en package.json
   - Crea GitHub Release automáticamente
   - Incluye archivos de documentación

4. **Deploy Documentation**
   - Copia archivos .md a `/docs`
   - Deploy a GitHub Pages

5. **Notify Success**
   - Notificación de pipeline exitoso

### Triggers

```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
```

### Variables de Entorno

El pipeline usa estas variables:

```yaml
env:
  NODE_VERSION: '18.x'
  VITE_TSA_URL: ${{ secrets.VITE_TSA_URL || 'https://freetsa.org/tsr' }}
```

---

## 5. GITHUB SECRETS

### Configurar Secrets

**Ubicación**: Settings > Secrets and variables > Actions

#### Secrets Requeridos

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `VITE_GOOGLE_DRIVE_ACCESS_TOKEN` | OAuth 2.0 token | `ya29.a0AfH6SMB...` |
| `VITE_GOOGLE_DRIVE_FOLDER_ID` | Folder ID | `1a2b3c4d5e6f7g8h` |
| `VITE_AWS_S3_PRESIGNED_URL` | Pre-signed URL | `https://bucket.s3...` |
| `VITE_AWS_S3_BUCKET` | Bucket name | `accountexpress-backups` |
| `VITE_AWS_S3_REGION` | AWS region | `us-east-1` |
| `VITE_AWS_S3_ACCESS_KEY_ID` | IAM Access Key | `AKIA...` |
| `VITE_AWS_S3_SECRET_ACCESS_KEY` | IAM Secret | `secret...` |
| `VITE_BACKUP_SERVER_URL` | REST API URL | `https://api.example.com` |
| `VITE_BACKUP_SERVER_TOKEN` | API token | `token...` |
| `VITE_TSA_URL` | TSA endpoint | `https://freetsa.org/tsr` |

### Agregar Secret

```bash
# Vía GitHub UI:
# 1. Ve a Settings > Secrets and variables > Actions
# 2. Click "New repository secret"
# 3. Name: VITE_GOOGLE_DRIVE_ACCESS_TOKEN
# 4. Value: tu_token_aqui
# 5. Click "Add secret"
```

### Usar Secrets en Código

```typescript
// En producción, leer desde variables de entorno
const accessToken = import.meta.env.VITE_GOOGLE_DRIVE_ACCESS_TOKEN;

// En desarrollo, leer desde .env.local
// NUNCA hardcodear credenciales en el código
```

---

## 6. GITHUB PAGES

### Activar GitHub Pages

**Ubicación**: Settings > Pages

#### Configuración

1. **Source**: Deploy from a branch
2. **Branch**: `gh-pages`
3. **Folder**: `/ (root)`

### URL de Documentación

```
https://TuUsuario.github.io/AccountExpress/
```

### Archivos Publicados

- `README.md`
- `CHANGELOG_v1.0.1.md`
- `ESTADO-ACTUAL-SISTEMA.md`
- `MANUAL_AUDITORIA_RFC3161.md`
- `AUDITORIA_QA_SENIOR.md`
- `FINALIZACION_COMPLETA.md`

### Actualización Automática

El workflow `docs` actualiza GitHub Pages automáticamente en cada push a `main`.

---

## 7. PRIMER PUSH

### Verificación Pre-Push

```bash
# 1. Verificar archivos en staging
git status

# 2. Buscar credenciales accidentales
git diff --cached | grep -E "API_KEY|SECRET|PASSWORD|TOKEN"

# 3. Verificar que NO aparecen archivos sensibles
git ls-files | grep -E "\.env$|\.db$|\.aex$"

# Si encuentras algo, usa:
git reset HEAD <archivo>  # Quitar del staging
git rm --cached <archivo> # Dejar de trackear
```

### Ejecutar Push

```bash
# Push a main
git push -u origin main

# Push a develop
git push -u origin develop

# Push tags
git push --tags
```

### Verificar Pipeline

1. Ve a **Actions** en GitHub
2. Verifica que el workflow se ejecute correctamente
3. Revisa los logs de cada job
4. Confirma que el release se creó (si cambió la versión)

---

## 8. WORKFLOW DE DESARROLLO

### Desarrollo de Nueva Feature

```bash
# 1. Actualizar develop
git checkout develop
git pull origin develop

# 2. Crear feature branch
git checkout -b feature/nueva-funcionalidad

# 3. Desarrollar y commitear
git add .
git commit -m "feat: agregar nueva funcionalidad"

# 4. Push a GitHub
git push -u origin feature/nueva-funcionalidad

# 5. Crear Pull Request en GitHub
# - Base: develop
# - Compare: feature/nueva-funcionalidad

# 6. Esperar aprobación y merge
# 7. Eliminar branch local
git checkout develop
git branch -d feature/nueva-funcionalidad
```

### Crear Release

```bash
# 1. Actualizar versión en package.json
npm version patch  # 1.0.1 -> 1.0.2
# o
npm version minor  # 1.0.1 -> 1.1.0
# o
npm version major  # 1.0.1 -> 2.0.0

# 2. Crear changelog
# Editar CHANGELOG_v1.0.2.md

# 3. Commit cambios
git add .
git commit -m "chore: bump version to 1.0.2"

# 4. Merge develop a main
git checkout main
git merge develop

# 5. Push (trigger auto-release)
git push origin main --tags

# 6. GitHub Actions creará el release automáticamente
```

### Convenciones de Commits

```bash
# Formato: <tipo>: <descripción>

feat: agregar nueva funcionalidad
fix: corregir bug en cálculo de impuestos
docs: actualizar README
style: formatear código
refactor: refactorizar BackupService
test: agregar tests para AIRepairService
chore: actualizar dependencias
```

---

## 9. TROUBLESHOOTING

### Problema: "Remote already exists"

```bash
# Ver remote actual
git remote -v

# Cambiar URL
git remote set-url origin https://github.com/TuUsuario/AccountExpress.git
```

### Problema: "Permission denied (publickey)"

```bash
# Generar SSH key
ssh-keygen -t ed25519 -C "tu@email.com"

# Agregar a ssh-agent
ssh-add ~/.ssh/id_ed25519

# Copiar clave pública
cat ~/.ssh/id_ed25519.pub

# Agregar a GitHub: Settings > SSH and GPG keys > New SSH key
```

### Problema: "Failed to push some refs"

```bash
# Pull primero
git pull origin main --rebase

# Resolver conflictos si hay
git add .
git rebase --continue

# Push
git push origin main
```

### Problema: "Workflow no se ejecuta"

1. Verificar que `.github/workflows/main.yml` existe
2. Verificar sintaxis YAML
3. Verificar permisos en Settings > Actions > General
4. Activar "Allow all actions and reusable workflows"

### Problema: "Release no se crea"

1. Verificar que estás en rama `main`
2. Verificar que cambió la versión en `package.json`
3. Verificar que el tag no existe ya: `git tag -l`
4. Revisar logs del job `release` en Actions

### Problema: "GitHub Pages no funciona"

1. Verificar que está activado en Settings > Pages
2. Verificar que la rama `gh-pages` existe
3. Esperar 5-10 minutos para el deploy
4. Revisar logs del job `docs` en Actions

---

## ✅ CHECKLIST FINAL

### Pre-Push

- [ ] ✅ `.gitignore` configurado
- [ ] ✅ No hay archivos `.env` en staging
- [ ] ✅ No hay archivos `.db` en staging
- [ ] ✅ No hay archivos `.aex` en staging
- [ ] ✅ Búsqueda de credenciales: 0 resultados
- [ ] ✅ Tests pasan localmente
- [ ] ✅ Build exitoso localmente

### Post-Push

- [ ] ✅ Pipeline de GitHub Actions exitoso
- [ ] ✅ Release creado (si cambió versión)
- [ ] ✅ GitHub Pages actualizado
- [ ] ✅ Documentación visible en Pages
- [ ] ✅ Secrets configurados en GitHub

---

## 📚 RECURSOS

### GitHub

- **Repositorio**: https://github.com/TuUsuario/AccountExpress
- **Actions**: https://github.com/TuUsuario/AccountExpress/actions
- **Releases**: https://github.com/TuUsuario/AccountExpress/releases
- **Pages**: https://TuUsuario.github.io/AccountExpress/

### Documentación

- **GitHub Actions**: https://docs.github.com/en/actions
- **GitHub Pages**: https://docs.github.com/en/pages
- **Git**: https://git-scm.com/doc

---

## 🆘 SOPORTE

Si tienes problemas:

1. Revisa esta guía
2. Revisa logs de GitHub Actions
3. Busca en GitHub Issues
4. Contacta al equipo de desarrollo

---

**Creado por**: Antigravity AI - Senior Full-Stack Engineer  
**Fecha**: 9 de febrero de 2026  
**Versión**: 1.0.1  
**Estado**: ✅ LISTO PARA GITHUB
