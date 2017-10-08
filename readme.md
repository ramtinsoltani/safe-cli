# What is Safe CLI?

Safe CLI is a simple Command Line Integration tool which encrypts and decrypts UTF-8 files using AES-256.

# Installation

`npm install -g safe-cli`

# Usage

- **Encryption:** Use `safe encrypt <file>` to encrypt a file at the given path (if the path includes spaces, wrap it with double-quotations). An encrypted file will be created at the same directory with the .safe extension.
  - **Swapping:** You can swap the original file with the encrypted .safe file by using either `-s` or `--swap` flags.
  - **Temporary Encryption:** When using the `-t` or `--temp` flags, the process will be kept open until the user hits <key>ENTER</key> or kills the process, at which the encrypted file will be deleted. (this feature makes more sense when decrypting).
- **Decryption:** Use `safe decrypt <file>` to decrypt a file at the given path (the file must have the .safe extension). The decrypted file with the original extension will be created at the same directory.
  - **Swapping:** You can swap the original file with the decrypted .safe file by using either `-s` or `--swap` flags.
  - **Temporary Decryption:** When using the `-t` or `--temp` flags, the process will be kept open until the user hits <key>ENTER</key> or kills the process, at which the decrypted file will be deleted.
