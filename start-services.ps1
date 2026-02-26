# ============================================================
# start-services.ps1
# Runs all backend services locally without Docker
# (Uses Maven wrapper to build + run each service in a new terminal window)
#
# Requirements:
#   - Java 17+ on PATH  (java -version)
#   - Maven 3.9+        (mvn -version)  OR use included ./mvnw wrappers
#   - PostgreSQL on localhost:5432 with DB "patientdb" (see DB SETUP below)
#   - Kafka on localhost:9092  (or use Docker just for infra — see tip below)
#
# DB SETUP (one-time):
#   psql -U postgres -c "CREATE DATABASE patientdb;"
#
# TIP — run only infrastructure in Docker, services with Maven:
#   docker compose up -d postgres kafka
#   Then run this script.
#
# Usage:
#   .\start-services.ps1               # start all services
#   .\start-services.ps1 -SkipBuild    # skip mvn package (faster if already built)
# ============================================================

param(
    [switch]$SkipBuild
)

$ROOT = $PSScriptRoot

function Start-Service {
    param(
        [string]$Name,
        [string]$Dir,
        [string]$JarPattern,
        [string]$ExtraArgs = ""
    )

    $fullDir = Join-Path $ROOT $Dir
    $targetDir = Join-Path $fullDir "target"

    if (-not $SkipBuild) {
        Write-Host "⚙  Building $Name..." -ForegroundColor Cyan
        Push-Location $fullDir
        & .\mvnw.cmd -DskipTests clean package -q
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗  Build failed for $Name" -ForegroundColor Red
            Pop-Location
            return
        }
        Pop-Location
        Write-Host "✓  $Name built" -ForegroundColor Green
    }

    $jar = Get-ChildItem -Path $targetDir -Filter $JarPattern | Select-Object -First 1
    if (-not $jar) {
        Write-Host "✗  JAR not found for $Name in $targetDir ($JarPattern)" -ForegroundColor Red
        return
    }

    Write-Host "▶  Starting $Name on new terminal window..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", `
        "Write-Host '=== $Name ===' -ForegroundColor Cyan; java -jar '$($jar.FullName)' $ExtraArgs"
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Magenta
Write-Host " Patient Management System — Backend Start" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""

# ── 1. Auth Service (port 4005) ──────────────────────────────
Start-Service `
    -Name "auth-service" `
    -Dir "auth-service" `
    -JarPattern "auth-service-*.jar"

Start-Sleep -Seconds 5   # Give auth-service time to start before gateway needs it

# ── 2. Billing Service (port 4001, gRPC: 9001) ──────────────
Start-Service `
    -Name "billing-service" `
    -Dir "billing-service" `
    -JarPattern "billing-service-*.jar"

# ── 3. Patient Service (port 4000) ──────────────────────────
#    Overrides: local postgres + local kafka + local billing gRPC
Start-Service `
    -Name "patient-service" `
    -Dir "patient-service" `
    -JarPattern "patient-service-*.jar" `
    -ExtraArgs ("--spring.datasource.url=jdbc:postgresql://localhost:5432/patientdb " +
                "--spring.datasource.username=postgres " +
                "--spring.datasource.password=postgres " +
                "--spring.jpa.hibernate.ddl-auto=update " +
                "--spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect " +
                "--spring.kafka.bootstrap-servers=localhost:9092")

Start-Sleep -Seconds 5

# ── 4. Analytics Service (port 4002) ────────────────────────
Start-Service `
    -Name "analytics-service" `
    -Dir "analytics-service" `
    -JarPattern "analytics-service-*.jar" `
    -ExtraArgs "--spring.kafka.bootstrap-servers=localhost:9092"

# ── 5. Gateway (port 4004) ──────────────────────────────────
#    Uses application-prod.yaml which routes to host.docker.internal
#    On local (non-Docker) runs we override with localhost
Start-Service `
    -Name "gateway" `
    -Dir "gateway" `
    -JarPattern "gateway-*.jar" `
    -ExtraArgs ("--auth.service.url=http://localhost:4005 " +
                "--spring.cloud.gateway.server.webflux.routes[0].uri=http://localhost:4005 " +
                "--spring.cloud.gateway.server.webflux.routes[1].uri=http://localhost:4000")

Write-Host ""
Write-Host "All services launched in separate windows." -ForegroundColor Green
Write-Host ""
Write-Host "  Gateway  →  http://localhost:4004"  -ForegroundColor White
Write-Host "  Auth     →  http://localhost:4005"  -ForegroundColor White
Write-Host "  Patients →  http://localhost:4000"  -ForegroundColor White
Write-Host "  Billing  →  http://localhost:4001  (gRPC: 9001)" -ForegroundColor White
Write-Host "  Analytics→  http://localhost:4002"  -ForegroundColor White
Write-Host ""
Write-Host "Frontend: cd frontend && npm start  →  http://localhost:4200" -ForegroundColor Cyan
Write-Host ""
