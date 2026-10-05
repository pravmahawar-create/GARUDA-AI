# Automated ADB Live Test Pipeline for Moto G96 5G
$adb = "C:\Users\hp\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$apkPath = "C:\Users\hp\OneDrive\Desktop\GARUDA\APK\Sanatan-Setu-v2.5.apk"
$outputProof = "D:\GARUDA-AI\output\sanatan_mobile_live_proof.png"

Write-Host ">>> Scanning for connected Android devices via ADB..."
$devices = & $adb devices
Write-Host $devices

$deviceFound = $false
foreach ($line in ($devices -split "`r?`n")) {
    if ($line -match "^\s*([^\s]+)\s+device\b") {
        $deviceFound = $true
        $deviceId = $matches[1]
        Write-Host ">>> Target Device Detected: $deviceId"
        break
    } elseif ($line -match "^\s*([^\s]+)\s+unauthorized\b") {
        Write-Host ">>> Device unauthorized! Please tap 'Allow USB debugging' on phone screen."
        exit 2
    }
}

if (-not $deviceFound) {
    Write-Host ">>> Device not yet in ADB mode. Make sure USB Debugging is turned ON in Developer Options."
    exit 1
}

Write-Host ">>> 1. Installing Sanatan-Setu-v2.5.apk..."
& $adb install -r $apkPath

Write-Host ">>> 2. Waking device screen..."
& $adb shell input keyevent 224

Write-Host ">>> 3. Launching Sanatan Setu App..."
& $adb shell am start -n in.garudaos.sanatansetu/in.garudaos.sanatansetu.MainActivity

Write-Host ">>> 4. Waiting for app render (3s)..."
Start-Sleep -Seconds 3

Write-Host ">>> 5. Capturing live screencap..."
& $adb shell screencap -p /sdcard/sanatan_screen.png
& $adb pull /sdcard/sanatan_screen.png $outputProof
& $adb shell rm /sdcard/sanatan_screen.png

if (Test-Path $outputProof) {
    Write-Host ">>> Live Proof Captured Successfully at: $outputProof"
    Get-Item $outputProof | Select-Object FullName, Length, LastWriteTime
}
