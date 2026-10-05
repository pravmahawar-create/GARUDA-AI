const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const CHROME_DIR = "C:\\Users\\hp\\AppData\\Local\\Google\\Chrome\\User Data";

function getMasterKey() {
  const localStatePath = path.join(CHROME_DIR, "Local State");
  const localState = JSON.parse(fs.readFileSync(localStatePath, "utf8"));
  const encryptedKeyB64 = localState.os_crypt?.encrypted_key;
  const encryptedKeyWithPrefix = Buffer.from(encryptedKeyB64, "base64");
  const encryptedKey = encryptedKeyWithPrefix.subarray(5); // strip 'DPAPI' prefix

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

function decryptCookie(encryptedBuffer, masterKey) {
  if (!encryptedBuffer || encryptedBuffer.length < 15) return null;
  const prefix = encryptedBuffer.subarray(0, 3).toString();
  if (prefix !== "v10" && prefix !== "v11") return null;

  const iv = encryptedBuffer.subarray(3, 15);
  const ciphertextWithTag = encryptedBuffer.subarray(15);
  const tag = ciphertextWithTag.subarray(ciphertextWithTag.length - 16);
  const ciphertext = ciphertextWithTag.subarray(0, ciphertextWithTag.length - 16);

  const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

function main() {
  const masterKey = getMasterKey();
  console.log("Master AES key decrypted.");

  const raw = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../data/raw_chrome_linkedin_cookies.json"), "utf8"));
  const decrypted = [];

  for (const c of raw.cookies) {
    if (!c.encrypted_value_b64) continue;
    const buf = Buffer.from(c.encrypted_value_b64, "base64");
    try {
      const val = decryptCookie(buf, masterKey);
      if (val) {
        decrypted.push({
          name: c.name,
          value: val,
          domain: c.host_key,
          path: c.path,
          secure: c.is_secure,
          httpOnly: c.is_httponly
        });
        console.log(`Decrypted cookie: ${c.name} (${c.host_key})`);
      }
    } catch (e) {
      console.warn(`Failed to decrypt ${c.name}:`, e.message);
    }
  }

  fs.writeFileSync(path.resolve(__dirname, "../data/active_linkedin_cookies.json"), JSON.stringify(decrypted, null, 2), "utf8");
  console.log(`Saved ${decrypted.length} decrypted cookies to data/active_linkedin_cookies.json`);
}

main();
