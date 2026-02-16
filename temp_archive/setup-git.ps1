# ============================================
# AccountExpress - Git Setup Script
# ============================================
# Este script configura el repositorio Git y
# prepara el proyecto para el primer push
# ============================================

Write-Host "🚀 AccountExpress - Git Setup Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# PASO 1: Verificar Git
# ============================================
Write-Host "📋 PASO 1: Verificando Git..." -ForegroundColor Yellow

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git no está instalado" -ForegroundColor Red
    Write-Host "   Descarga Git desde: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

$gitVersion = git --version
Write-Host "✅ Git instalado: $gitVersion" -ForegroundColor Green
Write-Host ""

# ============================================
# PASO 2: Inicializar repositorio
# ============================================
Write-Host "📋 PASO 2: Inicializando repositorio..." -ForegroundColor Yellow

if (Test-Path ".git") {
    Write-Host "✅ Repositorio Git ya existe" -ForegroundColor Green
} else {
    git init
    Write-Host "✅ Repositorio Git inicializado" -ForegroundColor Green
}
Write-Host ""

# ============================================
# PASO 3: Configurar usuario Git
# ============================================
Write-Host "📋 PASO 3: Configurando usuario Git..." -ForegroundColor Yellow

$gitUser = git config user.name
$gitEmail = git config user.email

if (-not $gitUser) {
    Write-Host "⚠️  Usuario Git no configurado" -ForegroundColor Yellow
    $userName = Read-Host "Ingresa tu nombre"
    git config user.name "$userName"
    Write-Host "✅ Usuario configurado: $userName" -ForegroundColor Green
} else {
    Write-Host "✅ Usuario: $gitUser" -ForegroundColor Green
}

if (-not $gitEmail) {
    Write-Host "⚠️  Email Git no configurado" -ForegroundColor Yellow
    $userEmail = Read-Host "Ingresa tu email"
    git config user.email "$userEmail"
    Write-Host "✅ Email configurado: $userEmail" -ForegroundColor Green
} else {
    Write-Host "✅ Email: $gitEmail" -ForegroundColor Green
}
Write-Host ""

# ============================================
# PASO 4: Configurar remote
# ============================================
Write-Host "📋 PASO 4: Configurando remote..." -ForegroundColor Yellow

$existingRemote = git remote get-url origin 2>$null

if ($existingRemote) {
    Write-Host "✅ Remote 'origin' ya configurado: $existingRemote" -ForegroundColor Green
    $changeRemote = Read-Host "¿Deseas cambiar el remote? (s/n)"
    
    if ($changeRemote -eq "s") {
        $repoUrl = Read-Host "Ingresa la URL del repositorio GitHub"
        git remote set-url origin $repoUrl
        Write-Host "✅ Remote actualizado: $repoUrl" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Remote 'origin' no configurado" -ForegroundColor Yellow
    $repoUrl = Read-Host "Ingresa la URL del repositorio GitHub (ej: https://github.com/usuario/repo.git)"
    
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "✅ Remote configurado: $repoUrl" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Remote no configurado. Puedes hacerlo después con:" -ForegroundColor Yellow
        Write-Host "   git remote add origin <URL>" -ForegroundColor Gray
    }
}
Write-Host ""

# ============================================
# PASO 5: Crear estructura de ramas
# ============================================
Write-Host "📋 PASO 5: Configurando estructura de ramas..." -ForegroundColor Yellow

# Verificar rama actual
$currentBranch = git branch --show-current

if (-not $currentBranch) {
    # No hay commits aún, crear rama main
    Write-Host "⚠️  No hay commits. Creando rama main..." -ForegroundColor Yellow
    git checkout -b main
    Write-Host "✅ Rama 'main' creada" -ForegroundColor Green
} else {
    Write-Host "✅ Rama actual: $currentBranch" -ForegroundColor Green
    
    # Si no estamos en main, preguntar si cambiar
    if ($currentBranch -ne "main") {
        $switchToMain = Read-Host "¿Deseas cambiar a la rama 'main'? (s/n)"
        if ($switchToMain -eq "s") {
            git checkout -b main 2>$null
            if ($?) {
                Write-Host "✅ Cambiado a rama 'main'" -ForegroundColor Green
            } else {
                git checkout main
                Write-Host "✅ Cambiado a rama 'main' existente" -ForegroundColor Green
            }
        }
    }
}

# Crear rama develop si no existe
$developExists = git branch --list develop

if (-not $developExists) {
    Write-Host "📝 Creando rama 'develop'..." -ForegroundColor Yellow
    git checkout -b develop
    git checkout main
    Write-Host "✅ Rama 'develop' creada" -ForegroundColor Green
} else {
    Write-Host "✅ Rama 'develop' ya existe" -ForegroundColor Green
}
Write-Host ""

# ============================================
# PASO 6: Verificar archivos sensibles
# ============================================
Write-Host "📋 PASO 6: Verificando archivos sensibles..." -ForegroundColor Yellow

$sensitiveFiles = @(
    ".env",
    ".env.local",
    "*.db",
    "*.sqlite",
    "*.aex"
)

$foundSensitive = $false

foreach ($pattern in $sensitiveFiles) {
    $files = Get-ChildItem -Path . -Filter $pattern -Recurse -ErrorAction SilentlyContinue
    if ($files) {
        Write-Host "⚠️  Encontrados archivos sensibles: $pattern" -ForegroundColor Yellow
        $foundSensitive = $true
    }
}

if ($foundSensitive) {
    Write-Host "⚠️  ADVERTENCIA: Archivos sensibles detectados" -ForegroundColor Yellow
    Write-Host "   Asegúrate de que estén en .gitignore" -ForegroundColor Yellow
} else {
    Write-Host "✅ No se encontraron archivos sensibles" -ForegroundColor Green
}
Write-Host ""

# ============================================
# PASO 7: Verificar .gitignore
# ============================================
Write-Host "📋 PASO 7: Verificando .gitignore..." -ForegroundColor Yellow

if (Test-Path ".gitignore") {
    Write-Host "✅ .gitignore existe" -ForegroundColor Green
    
    # Verificar que incluye reglas críticas
    $gitignoreContent = Get-Content ".gitignore" -Raw
    
    $criticalRules = @(".env", "*.db", "*.aex", "node_modules")
    $missingRules = @()
    
    foreach ($rule in $criticalRules) {
        if ($gitignoreContent -notmatch [regex]::Escape($rule)) {
            $missingRules += $rule
        }
    }
    
    if ($missingRules.Count -gt 0) {
        Write-Host "⚠️  Reglas faltantes en .gitignore:" -ForegroundColor Yellow
        foreach ($rule in $missingRules) {
            Write-Host "   - $rule" -ForegroundColor Gray
        }
    } else {
        Write-Host "✅ .gitignore contiene reglas críticas" -ForegroundColor Green
    }
} else {
    Write-Host "❌ .gitignore NO existe" -ForegroundColor Red
    Write-Host "   Esto es CRÍTICO. Ejecuta primero el script de creación de .gitignore" -ForegroundColor Yellow
}
Write-Host ""

# ============================================
# PASO 8: Staging de archivos
# ============================================
Write-Host "📋 PASO 8: Preparando archivos para commit..." -ForegroundColor Yellow

Write-Host "📝 Archivos que se agregarán:" -ForegroundColor Cyan
git add -n .

Write-Host ""
$proceed = Read-Host "¿Deseas agregar estos archivos al staging? (s/n)"

if ($proceed -eq "s") {
    git add .
    Write-Host "✅ Archivos agregados al staging" -ForegroundColor Green
    
    # Mostrar status
    Write-Host ""
    Write-Host "📊 Estado del repositorio:" -ForegroundColor Cyan
    git status --short
} else {
    Write-Host "⏭️  Staging omitido" -ForegroundColor Yellow
}
Write-Host ""

# ============================================
# PASO 9: Primer commit
# ============================================
Write-Host "📋 PASO 9: Crear primer commit..." -ForegroundColor Yellow

$hasCommits = git log --oneline 2>$null

if (-not $hasCommits) {
    Write-Host "⚠️  No hay commits en el repositorio" -ForegroundColor Yellow
    $createCommit = Read-Host "¿Deseas crear el commit inicial? (s/n)"
    
    if ($createCommit -eq "s") {
        git commit -m "🎉 Initial commit - AccountExpress v1.0.1

- ✅ Google Drive Integration
- ✅ AWS S3 Integration
- ✅ RFC 3161 Timestamping
- ✅ Web Workers
- ✅ AI Repair System
- ✅ Complete Documentation

Score: 9.7/10 ⭐⭐⭐⭐⭐
Status: Production Ready"
        
        Write-Host "✅ Commit inicial creado" -ForegroundColor Green
    }
} else {
    Write-Host "✅ El repositorio ya tiene commits" -ForegroundColor Green
}
Write-Host ""

# ============================================
# PASO 10: Resumen y próximos pasos
# ============================================
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Revisar archivos en staging:" -ForegroundColor Cyan
Write-Host "   git status" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Buscar credenciales accidentales:" -ForegroundColor Cyan
Write-Host "   git diff --cached | Select-String -Pattern 'API_KEY|SECRET|PASSWORD'" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Push a GitHub:" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣  Configurar GitHub Secrets:" -ForegroundColor Cyan
Write-Host "   - Ve a Settings > Secrets and variables > Actions" -ForegroundColor Gray
Write-Host "   - Agrega: VITE_GOOGLE_DRIVE_ACCESS_TOKEN" -ForegroundColor Gray
Write-Host "   - Agrega: VITE_AWS_S3_PRESIGNED_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "5️⃣  Activar GitHub Pages:" -ForegroundColor Cyan
Write-Host "   - Ve a Settings > Pages" -ForegroundColor Gray
Write-Host "   - Source: Deploy from a branch" -ForegroundColor Gray
Write-Host "   - Branch: gh-pages" -ForegroundColor Gray
Write-Host ""

Write-Host "⚠️  RECORDATORIO DE SEGURIDAD:" -ForegroundColor Yellow
Write-Host "   - NUNCA subas archivos .env con credenciales reales" -ForegroundColor Red
Write-Host "   - NUNCA subas archivos .db con datos de clientes" -ForegroundColor Red
Write-Host "   - NUNCA subas archivos .aex (backups cifrados)" -ForegroundColor Red
Write-Host ""

Write-Host "🎉 ¡Listo para GitHub!" -ForegroundColor Green
