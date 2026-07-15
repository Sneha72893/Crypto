# Secure Notes Analyzer

A futuristic, zero-gravity themed web application that securely encrypts and decrypts notes directly in the browser using the Web Crypto API.

##  Features

- **Real Cryptography**: Utilizes the native browser `window.crypto.subtle` API for AES-GCM 256-bit encryption.
- **Data Persistence**: Encrypted notes (ciphertext, salt, and IV) are stored locally in the browser's `localStorage`.
- **Zero Gravity UI**: Custom CSS and Javascript simulate orbital mechanics for a stunning visual experience.
- **Matrix Decryption**: A sleek character-scramble animation reveals your decrypted secrets.
- **100% Client-Side**: No backend servers involved. Your data never leaves your computer.

##   Technologies Used

- Vanilla HTML5
- CSS3 (Glassmorphism, 3D Transforms, Keyframe Animations)
- Vanilla Javascript (ES6 Modules, Web Crypto API, Web Audio API)

##  How to Run

Since this project relies entirely on client-side web technologies, no build step or backend server is required.

1. Clone the repository:
   ```bash
   git clone https://github.com/Sneha72893/Crypto.git
   ```
2. Open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).
3. OR use an extension like VS Code Live Server to serve the directory.

##  Security Details

When a user creates a note, the following cryptographic process occurs:
1. **Key Derivation**: The user's password and a randomly generated 16-byte salt are run through **PBKDF2** with 100,000 iterations to derive a secure AES key.
2. **Encryption**: The plaintext message is encrypted using **AES-GCM** with a random 12-byte Initialization Vector (IV).
3. **Storage**: The resulting ciphertext, salt, and IV are base64-encoded and saved to `localStorage`.

*Note: This is a portfolio project demonstrating frontend development and browser security APIs.*
