$dir = "c:\Account Express\src\components"
$files = Get-ChildItem $dir -Recurse -Filter *.tsx
foreach ($f in $files) {
    try {
        $c = [System.IO.File]::ReadAllText($f.FullName)
        if ($c -notmatch 'useLocale|useTranslation') {
            Write-Output ($f.FullName.Replace("c:\Account Express\", ""))
        }
    } catch {}
}
