function redmegit {
    param(
        [string]$Path = ".",
        [string]$OutputFile = "README.md"
    )

    $basePath = Resolve-Path $Path
    $readmePath = Join-Path $basePath $OutputFile

    $projectFolders = Get-ChildItem -Path $basePath -Directory | Where-Object { $_.Name -ne '.git' -and $_.Name -ne 'node_modules' }

    $content = @"
# Proyectos de Angel

Repositorio con todos mis proyectos de desarrollo web y programacion.

## Tabla de Contenidos

"@

    $toc = @()
    $sections = @()

    foreach ($folder in $projectFolders) {
        $folderName = $folder.Name
        $anchor = $folderName.ToLower() -replace '[^a-z0-9]', '-'
        $toc += "- [$folderName](#$anchor)"

        $files = Get-ChildItem -Path $folder.FullName -Recurse -File | Where-Object { $_.Extension -in '.html', '.js', '.css', '.json', '.md', '.txt', '.cpp', '.c', '.scss' }

        $section = @"

## $folderName

**Ruta:** ``$($folder.FullName)``

**Archivos:** $($files.Count)

| Archivo | Tamano | Ultima modificacion |
|---------|--------|---------------------|
"@

        foreach ($file in $files) {
            $relativePath = $file.FullName.Substring($folder.FullName.Length + 1)
            $size = if ($file.Length -lt 1KB) { "$($file.Length) B" } elseif ($file.Length -lt 1MB) { "$([math]::Round($file.Length / 1KB, 1)) KB" } else { "$([math]::Round($file.Length / 1MB, 1)) MB" }
            $modified = $file.LastWriteTime.ToString("yyyy-MM-dd")
            $section += "| ``$relativePath`` | $size | $modified |`n"
        }

        $sections += $section
    }

    $content += $toc -join "`n"
    $content += $sections -join "`n"

    $content += @"

---

Generado el $(Get-Date -Format "yyyy-MM-dd HH:mm:ss") por ``redmegit``
"@

    $content | Out-File -FilePath $readmePath -Encoding UTF8
    Write-Host "README.md generado en: $readmePath" -ForegroundColor Green
    Write-Host "Total de proyectos: $($projectFolders.Count)" -ForegroundColor Cyan
}

Export-ModuleMember -Function redmegit
