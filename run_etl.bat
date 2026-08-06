@echo off
REM ====================================================================
REM Automobile Data Warehouse ETL Pipeline - Windows Batch Runner
REM ====================================================================

SET "LOCAL_DIR=c:\Users\srika\OneDrive\Documents\C tutorial\DataEngineering\automobile-etl"
CD /D "%LOCAL_DIR%"

IF NOT EXIST "logs" MKDIR "logs"

SET "PYTHONPATH=%LOCAL_DIR%"
SET "LOG_FILE=%LOCAL_DIR%\logs\etl_run.log"

echo ==================================================================== >> "%LOG_FILE%"
echo ETL RUN STARTED AT: %DATE% %TIME% >> "%LOG_FILE%"
echo ==================================================================== >> "%LOG_FILE%"

"%LOCAL_DIR%\.venv\Scripts\python.exe" main.py >> "%LOG_FILE%" 2>&1

IF %ERRORLEVEL% EQU 0 (
    echo SUCCESS: ETL RUN COMPLETED AT %DATE% %TIME% >> "%LOG_FILE%"
    echo ==================================================================== >> "%LOG_FILE%"
    exit /b 0
) ELSE (
    echo ERROR: ETL RUN FAILED WITH EXIT CODE %ERRORLEVEL% AT %DATE% %TIME% >> "%LOG_FILE%"
    echo ==================================================================== >> "%LOG_FILE%"
    exit /b 1
)
