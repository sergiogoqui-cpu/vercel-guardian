param(
  [switch] $FailOnCritical
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$argsList = @("scripts/vercel-guardian.mjs")
if ($FailOnCritical -or $env:FAIL_ON_CRITICAL -eq "1") {
  $argsList += "--fail-on-critical"
}

node @argsList
