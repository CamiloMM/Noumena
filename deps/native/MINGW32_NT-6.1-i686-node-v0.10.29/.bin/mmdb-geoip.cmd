@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\maxmind-db-reader\repl" %*
) ELSE (
  node  "%~dp0\..\maxmind-db-reader\repl" %*
)