@echo off
REM Toggle Husky pre-commit hooks

if "%1"=="off" (
    echo Disabling Husky hooks...
    powershell -Command "(Get-Content package.json) -replace '\"husky\":', '\"husky-disabled\":' | Set-Content package.json"
    echo Husky hooks disabled. Use 'toggle-husky on' to re-enable.
) else if "%1"=="on" (
    echo Enabling Husky hooks...
    powershell -Command "(Get-Content package.json) -replace '\"husky-disabled\":', '\"husky\":' | Set-Content package.json"
    echo Husky hooks enabled.
) else (
    echo Usage: toggle-husky [on^|off]
    echo   toggle-husky off  - Disable Husky hooks
    echo   toggle-husky on   - Enable Husky hooks
)