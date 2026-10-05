const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const CHROME_DIR = "C:\\Users\\hp\\AppData\\Local\\Google\\Chrome\\User Data";

function getMasterKey() {
  const localStatePath = path.join(CHROME_DIR, "Local State");
  if (!fs.existsSync(localStatePath)) {
    throw new Error("Local State not found");
  }
  const localState = JSON.parse(fs.readFileSync(localStatePath, "utf8"));
  const encryptedKeyB64 = localState.os_crypt?.encrypted_key;
  if (!encryptedKeyB64) {
    throw new Error("No encrypted_key in Local State");
  }

  const encryptedKeyWithPrefix = Buffer.from(encryptedKeyB64, "base64");
  const encryptedKey = encryptedKeyWithPrefix.subarray(5); // strip 'DPAPI' prefix

  // Use powershell DPAPI Unprotect
  const tempEncPath = path.resolve(__dirname, "../data/temp_key.bin");
  const tempDecPath = path.resolve(__dirname, "../data/temp_dec.bin");
  fs.writeFileSync(tempEncPath, encryptedKey);

  const psCmd = `powershell -Command "Add-Type -AssemblyName System.Security; $bytes = [System.IO.File]::ReadAllBytes('${tempEncPath.replace(/\\/g, "/")}'); $dec = [System.Security.Cryptography.ProtectedData]::Unprotect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser); [System.IO.File]::WriteAllBytes('${tempDecPath.replace(/\\/g, "/")}', $dec)"`;
  execSync(psCmd);

  const masterKey = fs.readFileSync(tempDecPath);
  try { fs.unlinkSync(tempEncPath); } catch (e) {}
  try { fs.unlinkSync(tempDecPath); } catch (e) {}
  return masterKey;
}

function decryptCookie(encryptedValue, masterKey) {
  if (!encryptedValue || encryptedValue.length < 15) return null;
  const prefix = encryptedValue.subarray(0, 3).toString();
  if (prefix !== "v10" && prefix !== "v11") return null;

  const iv = encryptedValue.subarray(3, 15);
  const ciphertextWithTag = encryptedValue.subarray(15);
  const tag = ciphertextWithTag.subarray(ciphertextWithTag.length - 16);
  const ciphertext = ciphertextWithTag.subarray(0, ciphertextWithTag.length - 16);

  const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

async function extractCookies(profile = "Profile 1") {
  const masterKey = getMasterKey();
  console.log("✔ Master AES key decrypted successfully!");

  const cookieSrc = path.join(CHROME_DIR, profile, "Network", "Cookies");
  if (!fs.existsSync(cookieSrc)) {
    console.log("No cookie file for", profile);
    return [];
  }

  const tempDbPath = path.resolve(__dirname, `../data/temp_cookies_${profile.replace(/\s+/g, "_")}.db`);
  // Copy using powershell with ReadWrite share
  const copyCmd = `powershell -Command "$s = [System.IO.File]::Open('${cookieSrc.replace(/\\/g, "/")}', [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite); $d = [System.IO.File]::Create('${tempDbPath.replace(/\\/g, "/")}'); $s.CopyTo($d); $s.Close(); $d.Close()"`;
  execSync(copyCmd);

  console.log("✔ SQLite database copied cleanly without lock.");

  // Query SQLite
  const sqlite3 = require(path.resolve(__dirname, "../node_modules/sqlite3")).verbose();
  const db = new sqlite3.Database(tempDbPath);

  return new Promise((resolve, reject) => {
    db.all("SELECT host_key, name, path, encrypted_value, is_secure, is_httponly, expires_utc FROM cookies WHERE host_key LIKE '%linkedin%'", (err, rows) => {
      db.close();
      try { fs.unlinkSync(tempDbPath); } catch (e) {}
      if (err) return reject(err);

      const decryptedCookies = [];
      for (const row of rows) {
        try {
          const val = decryptCookie(row.encrypted_value, masterKey);
          if (val) {
            decryptedCookies.push({
              name: row.name,
              value: val,
              domain: row.host_key,
              path: row.path,
              secure: Boolean(row.is_secure),
              httpOnly: Boolean(row.is_httponly)
            });
          }
        } catch (decErr) {}
      }
      resolve(decryptedCookies);
    });
  });
}

async function main() {
  for (const prof of ["Profile 1", "Profile 3", "Default"]) {
    console.log(`\n--- Checking ${prof} ---`);
    try {
      const cookies = await extractCookies(prof);
      console.log(`Found ${cookies.length} LinkedIn cookies in ${prof}`);
      const liAt = cookies.find(c => c.name === "li_at");
      if (liAt) {
        console.log(`🎉 FOUND VALID li_at IN ${prof}!`);
        console.log(`Value snippet: ${liAt.value.substring(0, 15)}...${liAt.value.substring(liAt.value.length - 10)}`);
        fs.writeFileSync(path.resolve(__dirname, "../data/chrome-linkedin-cookies.json"), JSON.stringify(cookies, null, 2), "utf8");
        console.log(`Saved full cookie jar to data/chrome-linkedin-cookies.json`);
        return;
      }
    } catch (e) {
      console.log(`Error checking ${prof}:`, e.message);
    }
  }
}

main().catch(console.error);
