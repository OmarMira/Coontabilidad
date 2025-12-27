#!/bin/bash
echo "📊 REPORTE DE CUMPLIMIENTO TÉCNICO - ACCOUNTEXPRESS NEXT-GEN"
echo "============================================================"
echo "Fecha: $(date)"
echo "Repositorio: https://github.com/OmarMira/Coontabilidad"
echo "Directorio: $(pwd)"
echo ""

# 1. VERIFICAR STACK TECNOLÓGICO
echo "1. STACK TECNOLÓGICO:"
echo "===================="
if [[ -f "package.json" ]]; then
    node -e "
    const pkg = require('./package.json');
    const required = {
        'react': '^18.2.0',
        'typescript': '^5.3.0', 
        'vite': '^5.0.0',
        'tailwindcss': '^3.4.0',
        '@tanstack/react-query': '^5.0.0',
        'zustand': '^4.4.0',
        'zod': '^3.22.0',
        'lucide-react': '^0.309.0',
        'sql.js': '^1.8.0'
    };
    let passed = 0;
    let total = Object.keys(required).length;
    for (const [dep, version] of Object.entries(required)) {
        const actual = pkg.dependencies[dep] || pkg.devDependencies[dep];
        if (actual) {
            console.log('  ✅ ' + dep + ': ' + actual);
            passed++;
        } else {
            console.log('  ❌ ' + dep + ': REQUERIDO ' + version + ', NO ENCONTRADO');
        }
    }
    console.log('  RESULTADO: ' + passed + '/' + total + ' dependencias correctas');
    "
else
    echo "  ❌ package.json NO ENCONTRADO"
fi

# 2. VERIFICAR ESTRUCTURA DE DIRECTORIOS CRÍTICA
echo -e "\n2. ESTRUCTURA DE DIRECTORIOS CRÍTICA:"
echo "====================================="

declare -A REQUIRED_DIRS=(
    ["src/core/architecture"]="Arquitectura multicapa"
    ["src/core/security"]="Sistemas de cifrado"
    ["src/core/audit"]="Auditoría por lotes"
    ["src/core/migrations"]="Migraciones atómicas"
    ["src/core/workers"]="Worker Orchestrator"
    ["src/core/monitoring"]="Performance Monitor"
    ["src/services/ai"]="Servicios de IA"
    ["src/services/accounting"]="Servicios contables"
    ["src/database/models"]="Modelos de datos"
    ["src/database/schemas"]="Esquemas SQLite"
    ["src/ui/components"]="Componentes React"
    ["tests"]="Tests unitarios e2e"
)

for dir in "${!REQUIRED_DIRS[@]}"; do
    if [[ -d "$dir" ]]; then
        echo "  ✅ $dir - ${REQUIRED_DIRS[$dir]}"
    else
        echo "  ❌ FALTANTE: $dir - ${REQUIRED_DIRS[$dir]}"
    fi
done

# 3. VERIFICAR ARCHIVOS CRÍTICOS
echo -e "\n3. ARCHIVOS CRÍTICOS DEL SISTEMA:"
echo "================================="

declare -A REQUIRED_FILES=(
    ["src/core/architecture/ResilientStorage.ts"]="Arquitectura multicapa"
    ["src/core/security/HybridEncryptionSystem.js"]="Sistema de cifrado híbrido"
    ["src/core/audit/BatchAuditSystem.js"]="Auditoría por lotes"
    ["src/core/migrations/ResilientMigrationEngine.js"]="Motor de migraciones atómicas"
    ["src/core/workers/WorkerOrchestrator.js"]="Orquestador de workers"
    ["src/core/monitoring/IntelligentPerformanceMonitor.js"]="Monitor de performance"
    ["src/services/ai/ConversationalIAService.ts"]="Servicio de IA conversacional"
    ["src/services/ai/DeepSeekService.ts"]="Integración DeepSeek"
    ["src/database/models/ChartOfAccounts.ts"]="Modelo Plan de Cuentas"
    ["src/database/models/FloridaTaxConfig.ts"]="Configuración impuestos FL"
    ["src/database/simple-db.ts"]="Base de datos SQLite"
)

for file in "${!REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "  ✅ $file - ${REQUIRED_FILES[$file]}"
    else
        echo "  ❌ FALTANTE: $file - ${REQUIRED_FILES[$file]}"
    fi
done

# 4. VERIFICAR CONFIGURACIÓN DE FLORIDA TAX
echo -e "\n4. CONFIGURACIÓN FLORIDA TAX:"
echo "============================="
florida_keywords=("DR-15" "sales_tax" "surtax" "Miami-Dade" "Broward" "florida_tax")
florida_found=0

for keyword in "${florida_keywords[@]}"; do
    if find src -name "*.ts" -o -name "*.js" | xargs grep -l "$keyword" 2>/dev/null | grep -q .; then
        echo "  ✅ $keyword - Implementado"
        ((florida_found++))
    else
        echo "  ❌ $keyword - NO ENCONTRADO"
    fi
done

echo "  RESULTADO: $florida_found/${#florida_keywords[@]} elementos Florida Tax implementados"

# 5. VERIFICAR SISTEMA DE AUDITORÍA
echo -e "\n5. SISTEMA DE AUDITORÍA INMUTABLE:"
echo "=================================="
audit_keywords=("audit_chain" "blockchain" "hash" "immutable" "audit_log")
audit_found=0

for keyword in "${audit_keywords[@]}"; do
    if find src -name "*.ts" -o -name "*.js" | xargs grep -l "$keyword" 2>/dev/null | grep -q .; then
        echo "  ✅ $keyword - Implementado"
        ((audit_found++))
    else
        echo "  ❌ $keyword - NO ENCONTRADO"
    fi
done

echo "  RESULTADO: $audit_found/${#audit_keywords[@]} elementos de auditoría implementados"

# 6. VERIFICAR SISTEMA DE IA
echo -e "\n6. SISTEMA DE IA HÍBRIDO:"
echo "========================"
ai_keywords=("ConversationalIAService" "DeepSeekService" "QueryProcessor" "readonly" "fallback")
ai_found=0

for keyword in "${ai_keywords[@]}"; do
    if find src -name "*.ts" -o -name "*.js" | xargs grep -l "$keyword" 2>/dev/null | grep -q .; then
        echo "  ✅ $keyword - Implementado"
        ((ai_found++))
    else
        echo "  ❌ $keyword - NO ENCONTRADO"
    fi
done

echo "  RESULTADO: $ai_found/${#ai_keywords[@]} elementos de IA implementados"

# 7. VERIFICAR MODELO DE DATOS CRÍTICO
echo -e "\n7. MODELO DE DATOS CRÍTICO:"
echo "=========================="
critical_tables=("customers" "invoices" "journal_entries" "chart_of_accounts" "florida_tax_config" "audit_chain" "products" "suppliers")
tables_found=0

for table in "${critical_tables[@]}"; do
    if find src -name "*.ts" -o -name "*.js" | xargs grep -l "$table" 2>/dev/null | grep -q .; then
        echo "  ✅ $table - Implementado"
        ((tables_found++))
    else
        echo "  ❌ $table - FALTANTE"
    fi
done

echo "  RESULTADO: $tables_found/${#critical_tables[@]} tablas críticas implementadas"

# 8. VERIFICAR SEGURIDAD Y CIFRADO
echo -e "\n8. SEGURIDAD Y CIFRADO:"
echo "======================"
security_keywords=("AES-256-GCM" "PBKDF2" "WebCrypto" "encryption" "decrypt" "cipher")
security_found=0

for keyword in "${security_keywords[@]}"; do
    if find src -name "*.ts" -o -name "*.js" | xargs grep -l "$keyword" 2>/dev/null | grep -q .; then
        echo "  ✅ $keyword - Implementado"
        ((security_found++))
    else
        echo "  ❌ $keyword - NO ENCONTRADO"
    fi
done

echo "  RESULTADO: $security_found/${#security_keywords[@]} elementos de seguridad implementados"

# 9. VERIFICAR PRINCIPIOS CONTABLES
echo -e "\n9. PRINCIPIOS CONTABLES:"
echo "======================="
accounting_keywords=("double_entry" "partida_doble" "debit" "credit" "balance" "journal_entry")
accounting_found=0

for keyword in "${accounting_keywords[@]}"; do
    if find src -name "*.ts" -o -name "*.js" | xargs grep -l "$keyword" 2>/dev/null | grep -q .; then
        echo "  ✅ $keyword - Implementado"
        ((accounting_found++))
    else
        echo "  ❌ $keyword - NO ENCONTRADO"
    fi
done

echo "  RESULTADO: $accounting_found/${#accounting_keywords[@]} principios contables implementados"

# 10. VERIFICAR CONFIGURACIÓN DE ENTORNO
echo -e "\n10. CONFIGURACIÓN DE ENTORNO:"
echo "============================"
if [[ -f ".env.local" ]]; then
    echo "  ✅ .env.local - Presente"
    env_vars=("REACT_APP_AI_MODE" "REACT_APP_DEEPSEEK_API_KEY" "REACT_APP_SQLITE_VERSION")
    for var in "${env_vars[@]}"; do
        if grep -q "$var" .env.local; then
            echo "    ✅ $var - Configurado"
        else
            echo "    ❌ $var - FALTANTE"
        fi
    done
else
    echo "  ❌ .env.local - NO ENCONTRADO"
fi

# 11. RESUMEN DE CUMPLIMIENTO
echo -e "\n📊 RESUMEN DE CUMPLIMIENTO:"
echo "=========================="

# Calcular porcentajes
total_checks=8
passed_checks=0

if [[ $florida_found -ge 4 ]]; then ((passed_checks++)); fi
if [[ $audit_found -ge 3 ]]; then ((passed_checks++)); fi
if [[ $ai_found -ge 4 ]]; then ((passed_checks++)); fi
if [[ $tables_found -ge 6 ]]; then ((passed_checks++)); fi
if [[ $security_found -ge 3 ]]; then ((passed_checks++)); fi
if [[ $accounting_found -ge 4 ]]; then ((passed_checks++)); fi
if [[ -f ".env.local" ]]; then ((passed_checks++)); fi
if [[ -f "package.json" ]]; then ((passed_checks++)); fi

compliance_percentage=$((passed_checks * 100 / total_checks))

echo "  Cumplimiento General: $passed_checks/$total_checks ($compliance_percentage%)"
echo ""

if [[ $compliance_percentage -ge 90 ]]; then
    echo "🎯 ESTADO: ✅ CUMPLIMIENTO EXCELENTE"
    echo "   El sistema cumple con la especificación técnica"
elif [[ $compliance_percentage -ge 70 ]]; then
    echo "🎯 ESTADO: ⚠️  CUMPLIMIENTO PARCIAL"
    echo "   Requiere correcciones menores"
else
    echo "🎯 ESTADO: ❌ CUMPLIMIENTO INSUFICIENTE"
    echo "   Requiere implementación de componentes críticos"
fi

echo ""
echo "⚠️  ACCIONES REQUERIDAS:"
echo "  1. Implementar componentes faltantes marcados con ❌"
echo "  2. Ejecutar pruebas de integridad contable"
echo "  3. Validar cifrado de base de datos"
echo "  4. Verificar generación de reportes DR-15"
echo "  5. Probar recuperación de backups cifrados"
echo ""
echo "📋 Para corrección automática, ejecutar: ./restore_structure.sh"