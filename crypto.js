// crypto.js
// Handles Web Crypto API logic for the application

/**
 * Derives an AES-GCM key from a password and salt using PBKDF2
 */
export async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypts a plaintext note using a password
 */
export async function encryptNote(text, password) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    
    const enc = new TextEncoder();
    const cipherBuffer = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        enc.encode(text)
    );
    
    // Convert array buffers to base64 strings for easy JSON storage
    const cipherArray = Array.from(new Uint8Array(cipherBuffer));
    const saltArray = Array.from(salt);
    const ivArray = Array.from(iv);
    
    return {
        ciphertext: btoa(String.fromCharCode.apply(null, cipherArray)),
        salt: btoa(String.fromCharCode.apply(null, saltArray)),
        iv: btoa(String.fromCharCode.apply(null, ivArray))
    };
}

/**
 * Decrypts an encrypted note object using a password
 */
export async function decryptNote(encryptedData, password) {
    try {
        const salt = new Uint8Array(atob(encryptedData.salt).split('').map(c => c.charCodeAt(0)));
        const iv = new Uint8Array(atob(encryptedData.iv).split('').map(c => c.charCodeAt(0)));
        const ciphertext = new Uint8Array(atob(encryptedData.ciphertext).split('').map(c => c.charCodeAt(0)));
        
        const key = await deriveKey(password, salt);
        
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            ciphertext
        );
        
        const dec = new TextDecoder();
        return dec.decode(decryptedBuffer);
    } catch (e) {
        throw new Error("Invalid password");
    }
}
