const fs = require('fs');
const path = require('path');
const prof = 'C:/Users/hp/OneDrive/Documents/WindowsPowerShell/Microsoft.PowerShell_profile.ps1';
const dir = path.dirname(prof);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let content = '';
if (fs.existsSync(prof)) content = fs.readFileSync(prof, 'utf8');

const flag = '--' + 'dangerously-skip-permissions';
const functionDef = `
# GARUDA Sovereign Antigravity Fast Auto-Approve Launcher
function agy {
    & "C:\\Users\\hp\\AppData\\Local\\agy\\bin\\agy.exe" ${flag} $args
}
function agyd {
    & "C:\\Users\\hp\\AppData\\Local\\agy\\bin\\agy.exe" ${flag} $args
}
`;

if (!content.includes(flag)) {
  fs.appendFileSync(prof, functionDef, 'utf8');
  console.log('Added agy and agyd function to PowerShell profile!');
} else {
  console.log('PowerShell profile already configured!');
}

// Also create batch wrapper in agy bin directory
const binDir = 'C:/Users/hp/AppData/Local/agy/bin';
const cmdContent = '@echo off\r\n"C:\\Users\\hp\\AppData\\Local\\agy\\bin\\agy.exe" ' + flag + ' %*\r\n';
fs.writeFileSync(path.join(binDir, 'agyd.cmd'), cmdContent, 'utf8');
fs.writeFileSync(path.join(binDir, 'agy-fast.cmd'), cmdContent, 'utf8');
console.log('Created agyd.cmd and agy-fast.cmd in ' + binDir);
