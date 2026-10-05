$source = @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

public class MemoryCleaner {
    [DllImport("psapi.dll")]
    public static extern int EmptyWorkingSet(IntPtr hwProc);

    public static void CleanAll() {
        Process[] processes = Process.GetProcesses();
        foreach (Process process in processes) {
            try {
                if (process.Id <= 4) continue;
                EmptyWorkingSet(process.Handle);
            } catch {}
        }
    }
}
"@

try {
    Add-Type -TypeDefinition $source
    [MemoryCleaner]::CleanAll()
    [GC]::Collect()
} catch {}

$os = Get-CimInstance Win32_OperatingSystem
$totalMB = [math]::Round($os.TotalVisibleMemorySize / 1024, 0)
$freeMB = [math]::Round($os.FreePhysicalMemory / 1024, 0)
$usedMB = $totalMB - $freeMB
$pct = [math]::Round(($usedMB / $totalMB) * 100, 1)

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "  GARUDA RAM BOOSTER - CLEANUP COMPLETED  " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Total RAM: $totalMB MB"
Write-Host "Free RAM:  $freeMB MB" -ForegroundColor Yellow
Write-Host "Memory Load: $pct %"
Write-Host "Sabhi open apps aur tabs bilkul safe hain!`n"
