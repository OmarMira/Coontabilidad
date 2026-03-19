$srcPath = "C:\Account Express\src"
$skipPattern = "simple-db|e2e\.test|\.test\.|\.spec\.|App\.tsx|insert-dr15|WALManager|forceInitDB|auto-diagnosis|AuthContext|verify-|PersistentStorageService|PayrollProcessor|SystemLogger|008_|DataHealthCheck|SQLiteEngine|MigrationEngine|accounting-queries|verifyRoles|ui-responsiveness|S3Provider|013_|ProductionLogger|010_|011_|012_|015_|021_|024_|036_|009_|007_|016_|017_|018_|020_|025_|027_|029_|031_|032_|033_|034_|035_|verify_ai_sql|SystemLogs"

$files = Get-ChildItem -Path $srcPath -Recurse -Include "*.ts","*.tsx" | Where-Object { $_.FullName -notmatch $skipPattern }

$totalReplaced = 0
$filesModified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "console\.(log|error|warn|info)") {
        # Check if logger already imported
        $hasLogger = $content -match "SystemLogger|ProductionLogger"
        
        # Add import if missing
        if (-not $hasLogger) {
            # Determine relative path depth
            $relativePath = $file.FullName.Replace("$srcPath\", "").Replace("\", "/")
            $depth = ($relativePath -split "/").Count - 1
            $prefix = "../" * $depth
            $importLine = "import { logger } from '${prefix}core/logging/SystemLogger';"
            $content = $importLine + "`n" + $content
        }
        
        # Count before
        $before = ([regex]::Matches($content, "console\.(log|error|warn|info)")).Count
        
        # Replace patterns
        $content = $content -replace "console\.error\(([^;]+)\)", "logger.error('$($file.BaseName)', 'error', $1)"
        $content = $content -replace "console\.warn\(([^;]+)\)", "logger.warn('$($file.BaseName)', 'warn', $1)"
        $content = $content -replace "console\.log\(([^;]+)\)", "logger.info('$($file.BaseName)', 'info', $1)"
        $content = $content -replace "console\.info\(([^;]+)\)", "logger.info('$($file.BaseName)', 'info', $1)"
        
        $after = ([regex]::Matches($content, "console\.(log|error|warn|info)")).Count
        $replaced = $before - $after
        
        if ($replaced -gt 0) {
            Set-Content $file.FullName $content -Encoding UTF8
            $totalReplaced += $replaced
            $filesModified++
            Write-Host "[$filesModified] $($file.Name): $replaced reemplazos"
        }
    }
}

Write-Host "TOTAL: $totalReplaced instancias en $filesModified archivos"
