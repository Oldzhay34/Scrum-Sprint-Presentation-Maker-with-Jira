<#
.SYNOPSIS
  Bir kerelik yerel veri tasima araci: docker-compose'daki eski MSSQL
  container'indaki gercek dev verisini, yeni Postgres container'ina JDBC
  uzerinden dogrudan kopyalar (CSV yok, escaping riski yok).

.NOTES
  ON KOSUL: Postgres schema'si onceden olusturulmus olmali. Yani bu script'ten
  ONCE en az bir kere "docker-compose up backend" (postgres'e karsi) calistirip
  Flyway migration'larinin gecmesini bekleyin, sonra backend'i durdurun
  (Ctrl+C ya da "docker-compose stop backend") ve bu script'i calistirin.
#>

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

# --- .env'den DB_* ve MSSQL_SA_PASSWORD degerlerini oku ---
$envVars = @{}
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $parts = $_.Split('=', 2)
    $envVars[$parts[0].Trim()] = $parts[1].Trim()
}

$dbName = $envVars["DB_NAME"]
$pgUser = $envVars["DB_USERNAME"]
$pgPass = $envVars["DB_PASSWORD"]
$mssqlPass = $envVars["MSSQL_SA_PASSWORD"]

if (-not $mssqlPass) {
    Write-Error ".env icinde MSSQL_SA_PASSWORD bulunamadi - eski MSSQL'in sa parolasini bu degiskene ekleyin."
    exit 1
}

Write-Host "1/5 - Eski MSSQL ve yeni Postgres container'lari ayaga kaldiriliyor..." -ForegroundColor Cyan
docker-compose --profile migration up -d mssql
docker-compose up -d postgres

function Wait-Healthy($containerName) {
    Write-Host "   $containerName saglikli olana kadar bekleniyor..."
    for ($i = 0; $i -lt 60; $i++) {
        $status = docker inspect --format='{{.State.Health.Status}}' $containerName 2>$null
        if ($status -eq "healthy") { return }
        Start-Sleep -Seconds 3
    }
    Write-Error "$containerName 3 dakika icinde saglikli duruma gelmedi."
    exit 1
}
Wait-Healthy "capacity-planner-mssql"
Wait-Healthy "capacity-planner-postgres"

Write-Host "2/5 - JDBC surucu jar'lari indiriliyor (mssql-jdbc + postgresql)..." -ForegroundColor Cyan
$libDir = Join-Path $PSScriptRoot "migrate-local-mssql-to-postgres\lib"
New-Item -ItemType Directory -Force -Path $libDir | Out-Null

mvn -q org.apache.maven.plugins:maven-dependency-plugin:3.6.1:copy `
    "-Dartifact=com.microsoft.sqlserver:mssql-jdbc:12.8.1.jre11" `
    "-DoutputDirectory=$libDir"
mvn -q org.apache.maven.plugins:maven-dependency-plugin:3.6.1:copy `
    "-Dartifact=org.postgresql:postgresql:42.7.4" `
    "-DoutputDirectory=$libDir"

$mssqlJar = Join-Path $libDir "mssql-jdbc-12.8.1.jre11.jar"
$pgJar = Join-Path $libDir "postgresql-42.7.4.jar"

# PATH'teki "java" farkli (eski) bir JRE'ye isaret edebilir - javac'nin
# derledigi class dosyasini calistiramaz (UnsupportedClassVersionError).
# JAVA_HOME altindaki surumu acikca kullan.
if ($env:JAVA_HOME) {
    $javacExe = Join-Path $env:JAVA_HOME "bin\javac.exe"
    $javaExe = Join-Path $env:JAVA_HOME "bin\java.exe"
} else {
    $javacExe = "javac"
    $javaExe = "java"
}

Write-Host "3/5 - Migrate.java derleniyor..." -ForegroundColor Cyan
$srcDir = Join-Path $PSScriptRoot "migrate-local-mssql-to-postgres"
$classesDir = Join-Path $srcDir "classes"
New-Item -ItemType Directory -Force -Path $classesDir | Out-Null
& $javacExe -cp "$mssqlJar;$pgJar" -d $classesDir (Join-Path $srcDir "Migrate.java")
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "4/5 - Veri tasiniyor (MSSQL -> Postgres)..." -ForegroundColor Cyan
$mssqlUrl = "jdbc:sqlserver://localhost:1433;databaseName=$dbName;encrypt=true;trustServerCertificate=true"
$pgUrl = "jdbc:postgresql://localhost:5432/$dbName"

& $javaExe -cp "$classesDir;$mssqlJar;$pgJar" Migrate `
    $mssqlUrl "sa" $mssqlPass `
    $pgUrl $pgUser $pgPass
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "5/5 - Tamamlandi. Uygulamayi (docker-compose up backend) baslatip verileri kontrol edin." -ForegroundColor Green
Write-Host "Sorun yoksa: 'docker-compose --profile migration down' ve 'docker volume rm aksa-capacity-planner_capacity-planner-mssql-data' ile eski MSSQL'i temizleyebilirsiniz." -ForegroundColor DarkGray
