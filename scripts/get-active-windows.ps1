Get-Process chrome, msedge -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.MainWindowTitle) {
        Write-Output ("Process: " + $_.ProcessName + " [PID: " + $_.Id + "] Title: " + $_.MainWindowTitle)
    }
}
