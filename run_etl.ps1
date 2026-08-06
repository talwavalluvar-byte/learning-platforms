# ====================================================================
# Automobile Data Warehouse ETL Pipeline - PowerShell Runner
# ====================================================================

$ProjectRoot = "c:\Users\srika\OneDrive\Documents\C tutorial\DataEngineering\automobile-etl"
Set-Location -Path $ProjectRoot

# Ensure logs directory exists
$LogDir = Join-Path -Path $ProjectRoot -ChildPath "logs"
if (!(Test-Path -Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$LogFile = Join-Path -Path $LogDir -ChildPath "etl_run_$Timestamp.log"

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "Starting Automobile Star Schema ETL Pipeline" -ForegroundColor Cyan
Write-Host "Log file: $LogFile" -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Cyan

$env:PYTHONPATH = $ProjectRoot
$PythonExe = Join-Path -Path $ProjectRoot -ChildPath ".venv\Scripts\python.exe"

# Execute Main ETL
& $PythonExe main.py 2>&1 | Tee-Object -FilePath $LogFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host "SUCCESS: ETL Pipeline Completed Successfully!" -ForegroundColor Green
    Write-Host "====================================================================" -ForegroundColor Green
} else {
    Write-Host "====================================================================" -ForegroundColor Red
    Write-Host "ERROR: ETL Pipeline Execution Failed with exit code $LASTEXITCODE" -ForegroundColor Red
    Write-Host "====================================================================" -ForegroundColor Red
}
