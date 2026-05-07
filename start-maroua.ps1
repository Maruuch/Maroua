<#
.SYNOPSIS
  Maroua Jewelry - Boot complet de la stack n8n + ngrok apres reboot machine.

.DESCRIPTION
  Sequence executee :
    1. Verifie / lance Docker Desktop, attend que le moteur reponde
    2. docker compose up -d dans le dossier n8n
    3. Attend que n8n ecoute sur :5678
    4. Ouvre un onglet navigateur sur http://localhost:5678
    5. Lance ngrok (config dediee Maroua si presente, sinon tunnel direct)
    6. Recupere l'URL publique HTTPS via l'API ngrok locale, ouvre l'onglet
       et copie l'URL dans le presse-papiers

.PARAMETER ProjectPath
  Dossier contenant docker-compose.yml. Defaut : ~/maroua/n8n

.PARAMETER NgrokConfig
  Fichier de configuration ngrok. Defaut : ~/.ngrok/maroua.yml

.PARAMETER NgrokEndpoint
  Nom d'endpoint specifique a lancer. Vide = --all (tous les tunnels du YAML).

.PARAMETER N8nPort
  Port local n8n. Defaut : 5678

.PARAMETER WaitTimeoutSec
  Delai max d'attente que n8n soit pret. Defaut : 90 s

.EXAMPLE
  .\start-maroua.ps1
  .\start-maroua.ps1 -NgrokEndpoint "n8n"
  .\start-maroua.ps1 -ProjectPath "D:\dev\maroua\n8n"

.NOTES
  Si l'execution est bloquee par la policy PowerShell, lancez une fois :
    Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
#>

[CmdletBinding()]
param(
    [string]$ProjectPath    = "$env:USERPROFILE\maroua\n8n",
    [string]$NgrokConfig    = "$env:USERPROFILE\.ngrok\maroua.yml",
    [string]$NgrokEndpoint  = "",
    [int]   $N8nPort        = 5678,
    [int]   $WaitTimeoutSec = 90,
    [string]$LogDir         = "$env:USERPROFILE\maroua\logs",
    [int]   $LogKeepCount   = 20
)

$ErrorActionPreference = 'Stop'

# ---------- Logging : transcript dans un fichier date + rotation ----------
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}
$logTimestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logPath = Join-Path $LogDir "start-maroua-$logTimestamp.log"
Start-Transcript -Path $logPath -Append | Out-Null

# Rotation : ne garde que les N logs les plus recents
try {
    Get-ChildItem -Path $LogDir -Filter 'start-maroua-*.log' |
        Sort-Object LastWriteTime -Descending |
        Select-Object -Skip $LogKeepCount |
        Remove-Item -Force -ErrorAction SilentlyContinue
} catch { }

# Affichage du fichier de log au demarrage pour que l'utilisateur puisse le retrouver
Write-Host "Log de cette session : $logPath" -ForegroundColor DarkGray

# ---------- Helpers ----------
function Write-Step { param($Msg) Write-Host "`n==> $Msg" -ForegroundColor Cyan }
function Write-Ok   { param($Msg) Write-Host "    [OK] $Msg" -ForegroundColor Green }
function Write-Warn { param($Msg) Write-Host "    [!!] $Msg" -ForegroundColor Yellow }
function Write-Err  { param($Msg) Write-Host "    [KO] $Msg" -ForegroundColor Red }

function Test-DockerReady {
    try {
        docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
        return ($LASTEXITCODE -eq 0)
    } catch { return $false }
}

function Wait-DockerReady {
    param([int]$TimeoutSec = 120)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-DockerReady) { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

function Start-DockerDesktop {
    $candidates = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) {
            Start-Process -FilePath $p | Out-Null
            return $true
        }
    }
    return $false
}

function Wait-HttpReady {
    param([string]$Url, [int]$TimeoutSec)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($r.StatusCode -in 200,302,401,403) { return $true }
        } catch { Start-Sleep -Seconds 2 }
    }
    return $false
}

# ---------- 1) Docker Desktop ----------
Write-Step "Verification Docker Desktop"
if (Test-DockerReady) {
    Write-Ok "Docker deja operationnel"
} else {
    Write-Warn "Docker non demarre - lancement..."
    if (-not (Start-DockerDesktop)) {
        Write-Err "Docker Desktop introuvable. Installez-le ou ajustez le chemin."
        exit 1
    }
    Write-Host "    Attente du moteur Docker (max 2 min)..." -ForegroundColor DarkGray
    if (-not (Wait-DockerReady -TimeoutSec 120)) {
        Write-Err "Docker n'a pas demarre dans le delai imparti."
        exit 1
    }
    Write-Ok "Docker pret"
}

# ---------- 2) docker compose up -d ----------
Write-Step "Lancement n8n via docker compose"
if (-not (Test-Path $ProjectPath)) {
    Write-Err "Dossier projet introuvable : $ProjectPath"
    exit 1
}
Push-Location $ProjectPath
try {
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { throw "docker compose a echoue (code $LASTEXITCODE)" }
    Write-Ok "Compose lance"
} catch {
    Write-Err $_.Exception.Message
    Pop-Location
    exit 1
}
Pop-Location

# ---------- 3) Attente n8n ----------
Write-Step "Attente que n8n ecoute sur :$N8nPort"
$n8nUrl = "http://localhost:$N8nPort"
if (-not (Wait-HttpReady -Url $n8nUrl -TimeoutSec $WaitTimeoutSec)) {
    Write-Err "n8n ne repond pas apres $WaitTimeoutSec s. Verifiez : docker compose logs n8n"
    exit 1
}
Write-Ok "n8n repond ($n8nUrl)"

# ---------- 4) Ouvrir n8n ----------
Write-Step "Ouverture n8n dans le navigateur"
Start-Process $n8nUrl | Out-Null
Write-Ok "Onglet ouvert"

# ---------- 5) Lancer ngrok ----------
Write-Step "Lancement ngrok"
$ngrokCmd = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokCmd) {
    Write-Err "ngrok introuvable dans le PATH. Installez : choco install ngrok  ou  scoop install ngrok"
    Write-Warn "n8n est demarre, mais le tunnel public ne peut pas etre cree. Stack utilisable en local."
    exit 0
}
$ngrokExe = $ngrokCmd.Source

if (Test-Path $NgrokConfig) {
    if ($NgrokEndpoint) {
        Start-Process -FilePath $ngrokExe -ArgumentList @("start","--config","`"$NgrokConfig`"",$NgrokEndpoint) -WindowStyle Normal | Out-Null
        Write-Ok "ngrok lance : config $NgrokConfig, endpoint $NgrokEndpoint"
    } else {
        Start-Process -FilePath $ngrokExe -ArgumentList @("start","--all","--config","`"$NgrokConfig`"") -WindowStyle Normal | Out-Null
        Write-Ok "ngrok lance : config $NgrokConfig (--all)"
    }
} else {
    Start-Process -FilePath $ngrokExe -ArgumentList @("http","$N8nPort") -WindowStyle Normal | Out-Null
    Write-Warn "Config ngrok introuvable a $NgrokConfig - tunnel simple sur localhost:$N8nPort"
}

# ---------- 6) URL publique ngrok ----------
Write-Step "Recuperation de l'URL publique ngrok"
$publicUrl = $null
$deadline  = (Get-Date).AddSeconds(20)
while ((Get-Date) -lt $deadline) {
    try {
        $api = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 2 -ErrorAction Stop
        $tunnel = $api.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
        if ($tunnel) { $publicUrl = $tunnel.public_url; break }
    } catch { Start-Sleep -Seconds 1 }
}

if ($publicUrl) {
    Write-Ok "URL publique : $publicUrl"
    Start-Process $publicUrl | Out-Null
    try { Set-Clipboard -Value $publicUrl; Write-Ok "URL copiee dans le presse-papiers" } catch {}
} else {
    Write-Warn "Impossible de recuperer l'URL ngrok via l'API."
    Write-Warn "Ouvrez le tableau de bord ngrok local pour voir l'URL :"
    Start-Process "http://localhost:4040" | Out-Null
}

Write-Host "`n==> Stack Maroua Jewelry demarree. Bonne session !`n" -ForegroundColor Magenta
Write-Host "Log archive : $logPath`n" -ForegroundColor DarkGray
try { Stop-Transcript | Out-Null } catch { }
