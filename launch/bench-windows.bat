@echo off
rem Afterstreet benchmark, unattended: plays the fixed Springfield tour, sends the result to benchmarks/ in the repo, and closes.
rem First time only: open the game in the same browser, Menu > Report a bug > Sending settings, put in the repository and a token.
rem Usage: bench-windows.bat "Beelink mini"      (the name is kept with the result)
rem To run it on a schedule: Task Scheduler > Create Basic Task > Start a program > this file, with the name as the argument.
set "NAME=%~1"
if "%NAME%"=="" set "NAME=%COMPUTERNAME%"
call "%~dp0play-windows.bat" "?bench&send=1&close=1&label=%NAME%"
