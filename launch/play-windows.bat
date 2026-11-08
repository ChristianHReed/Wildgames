@echo off
rem Afterstreet: opens play.html from this drive in an app window (no address bar).
rem Uses Edge, Chrome, Chromium, Brave or Firefox, whichever is installed; else your default browser.
set "GAME=%~dp0..\play.html"
for %%I in ("%GAME%") do set "GAME=%%~fI"
set "URL=file:///%GAME:\=/%%~1"
call :find
if defined APPWIN ( start "" "%BROWSER%" --app="%URL%" & goto :eof )
if defined BROWSER ( start "" "%BROWSER%" "%URL%" & goto :eof )
start "" "%GAME%"
goto :eof
:find
set "BROWSER=" & set "APPWIN="
for %%P in ("%ProgramFiles%\Chromium\Application\chrome.exe" "%LocalAppData%\Chromium\Application\chrome.exe" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "%LocalAppData%\Google\Chrome\Application\chrome.exe" "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe") do if not defined BROWSER if exist %%P ( set "BROWSER=%%~P" & set "APPWIN=1" )
if not defined BROWSER for %%P in ("%ProgramFiles%\Mozilla Firefox\firefox.exe" "%ProgramFiles(x86)%\Mozilla Firefox\firefox.exe") do if not defined BROWSER if exist %%P set "BROWSER=%%~P"
goto :eof
