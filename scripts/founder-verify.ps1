param(
  [switch]$Full
)

$ErrorActionPreference = 'Stop'
$coreRoot = Split-Path -Parent $PSScriptRoot
$revenueRoot = Join-Path (Split-Path -Parent $coreRoot) 'garuda-emergent-revenue'
$foundationFiles = @(
  '01-GARUDA-CONSTITUTION.md',
  '02-FOUNDER-GOVERNANCE.md',
  '03-ENGINEERING-RULES.md',
  '04-REVENUE-CONSTITUTION.md',
  '05-SELF-BUILD-CONSTITUTION.md'
)

function Invoke-CheckedCommand {
  param(
    [string]$Label,
    [string]$WorkingDirectory,
    [scriptblock]$Command
  )

  Write-Host "`n[$Label]" -ForegroundColor Cyan
  Push-Location $WorkingDirectory
  try {
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$Label failed with exit code $LASTEXITCODE" }
  }
  finally {
    Pop-Location
  }
}

if (-not (Test-Path -LiteralPath (Join-Path $coreRoot 'package.json'))) { throw "GARUDA-AI repository was not found at $coreRoot" }
if (-not (Test-Path -LiteralPath (Join-Path $revenueRoot 'backend-node\package.json'))) { throw "Revenue backend repository was not found at $revenueRoot" }

Write-Host "`n[Foundation preflight]" -ForegroundColor Cyan
foreach ($file in $foundationFiles) {
  $path = Join-Path $coreRoot "docs\foundation\$file"
  if (-not (Test-Path -LiteralPath $path)) { throw "Required Foundation file is missing: $path" }
  Get-Content -LiteralPath $path -Raw | Out-Null
  Write-Host "Read $file"
}

Invoke-CheckedCommand 'Core approval policy test' $coreRoot { node src\motherCore\approval\approvalPolicy.test.js }
Invoke-CheckedCommand 'Revenue external-action test' $coreRoot { node src\services\revenueExternalActionService.test.js }
Invoke-CheckedCommand 'Core syntax check' $coreRoot { node --check src\motherCore\approval\approvalPolicy.js; node --check src\motherCore\agents\builderAgent.js; node --check src\motherCore\executor\safeExecutor.js }
Invoke-CheckedCommand 'Revenue backend build' (Join-Path $revenueRoot 'backend-node') { npm run build }

if ($Full) { Invoke-CheckedCommand 'Full GARUDA Mother test' $coreRoot { npm test } }

Write-Host "`n[Core Git status]" -ForegroundColor Cyan
git -C $coreRoot status --short
git -C $coreRoot diff --check
Write-Host "`n[Revenue Git status]" -ForegroundColor Cyan
git -C $revenueRoot status --short
git -C $revenueRoot diff --check
Write-Host "`nVerification complete. No commit or push was performed." -ForegroundColor Green
