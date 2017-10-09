# What is Safe CLI?

Safe CLI is a simple Command Line Integration tool which encrypts and decrypts UTF-8 files using AES-256.

# Installation

`npm install -g safe-cli`

# Usage

- **Encryption:** Use `safe encrypt <file>` to encrypt a file at the given path (if the path includes spaces, wrap it with double-quotations). An encrypted file will be created at the same directory with the .safe extension.
  - **Swapping:** You can swap the original file with the encrypted .safe file by using either `-s` or `--swap` flags.
  - **Reveal Key:** Using the `-r` or `--reveal` flags will show the key input.
- **Decryption:** Use `safe decrypt <file>` to decrypt a file at the given path (the file must have the .safe extension). The decrypted file with the original extension will be created at the same directory.
  - **Swapping:** You can swap the original file with the decrypted .safe file by using either `-s` or `--swap` flags (exclusive to the temporary flags).
  - **Temporary Decryption:** When using the `-t` or `--temp` flags, the process will be kept open until the user hits <kbd>ENTER</kbd> or kills the process, at which the decrypted file will be deleted (exclusive to the swap flags).
  - **Reveal Key:** Using the `-r` or `--reveal` flags will show the key input.
- **Generating Passwords:** Use `safe generate [length]` to generate a random string. By default, the string is 10 characters long, and contains letters (both uppercase and lowercase) and digits. You can use the following flags to change this:
  - **Uppercase Only:** `-u` or `--upper` (exclusive to the lowercase flags)
  - **Lowercase Only:** `-l` or `--lower` (exclusive to the uppercase flags)
  - **No Digits:** `-n` or `--nodigits`
  - **Special Characters:** `-s` or `--special`
  - **Spaces:** `-w` or `--space`
  - **Copy to Clipboard:** `-c` or `--copy`

## Examples

- Encrypt file at "D:/passwords.md" and remove the original/unencrypted file:  
    `safe encrypt D:/passwords.md --swap`
- Decrypt file at "D:/passwords.md.safe" and remove the encrypted file:  
    `safe decrypt D:/passwords.md.safe --swap`
- Temporarily decrypt the file at "D:/passwords.md.safe":  
    `safe decrypt D:/passwords.md.safe --temp`
- Generate a password (12 characters long, all letters, digits, and special characters):  
    `safe generate 12 --special`
