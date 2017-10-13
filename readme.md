# What is Safe CLI?

Safe CLI is a simple Command-line Interface which encrypts and decrypts UTF-8 files using AES-256.

![screenshot](https://user-images.githubusercontent.com/7918069/31544542-2922b342-afd0-11e7-9881-db568bc5ff41.png)

# Installation

`npm install -g safe-cli`

# Usage

- **Encryption:** Use `safe encrypt <file>` to encrypt a file at the given path (if the path includes spaces, wrap it with double-quotations). An encrypted file will be created at the same directory with the .safe extension.
  - **Swapping:** You can swap the original file with the encrypted .safe file by using either `-s` or `--swap` flags.
  - **Reveal Key:** Using the `-r` or `--reveal` flags will show the key input.
- **Decryption:** Use `safe decrypt <file>` to decrypt a file at the given path (the file must have the .safe extension to be recognized, if the provided path doesn't end with .safe, the application will automatically add .safe at the end of it). The decrypted file with the original extension will be created at the same directory.
  - **Swapping:** You can swap the original file with the decrypted .safe file by using either `-s` or `--swap` flags.  
  _This flag is exclusive and cannot be used in conjunction with the temp and hook flags._
  - **Temporary Decryption:** When using the `-t` or `--temp` flags, the process will be kept open until the user hits <kbd>ENTER</kbd> or kills the process, at which the decrypted file will be deleted.  
  _This flag is exclusive and cannot be used in conjunction with the swap and hook flags._
  - **Reveal Key:** Using the `-r` or `--reveal` flags will show the key input.
  - **Partial Decryption:** Using the `-h <value>` or `--hook <value>` flags will instruct the application to only decrypt a specific part of the file marked by the given data hooks. The encrypted part will be shown in the console and no file will be written on disk. The value can be either a single data hook, or a comma-separated list of data hooks to retrieve.  
  _This flag is exclusive and cannot be used in conjunction with the swap and temp flags._  

    To learn how to define data hooks inside your documents, read the [Data Hooks](#data-hooks) section.
  - **Copy to Clipboard:** Using the `-c` or `--copy` flags will copy the result of the partial decryption in the clipboard. This flag only works when used in conjunction with the `-h` or `--hook` flags and will behave differently based on the input. If multiple comma-separated data hooks are given, the result will be a JSON object in the clipboard, otherwise, the result is either a single string or a comma-separated string (only when overshadowing is disabled and multiple values are found for the data hook).
  - **No Overshadowing:** Using the `-n` or `--noshadow` flags will disable overshadowing of data hooks.
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

# Data Hooks

Data hooks are used to mark specific parts of a document, which then later can be decrypted and retrieved through the console without the need to write the whole file on disk and look for that specific part manually.

You can define a hook using the `@name{{value}}` syntax. Make sure your data hook names satisfy the following requirements:
- The data hook name will be trimmed, so it can contain spaces around it (and also can contain spaces inside).  
    Example:
    - `@name {{Jack}}` will be detected as `name` with value `Jack`
    - `@ name {{Jack}}` will be detected as `name` with value `Jack`
    - `@ name{{Jack}}` will be detected as `name` with value `Jack`
    - `@first name {{Jack}}` will be detected as `first name` with value `Jack`
- Identical data hook names will be overshadowed by the first defined data hook by default. However, this behavior can be modified using the `-n` or `--noshadow` flags.  
    Example (Overshadowed):
  - `@city{{Los Angeles}}\n@city{{Mountain View}}\n@city{{New York}}` will be detected as `city` with value `Los Angeles`
    Example (Non-overshadowed):
  - `@city{{Los Angeles}}\n@city{{Mountain View}}\n@city{{New York}}` will be detected as `city` with value `Los Angeles, Mountain View, New York`
- Data hook names are case insensitive.  
    Example:
  - Considering `@Country{{United States}}\n@country{{Canada}}`, the retrieved value for the data hook `country` or `Country` will be `United States`, since both names are treated as one and `country` is overshadowed by `Country` by default unless instructed otherwise.

## Example

Consider the following document (passwords.md):

```
| Website | Username | Password |
|---------|----------|----------|
| myWebsite1 | myUsername1 | myPassword1 |
| myWebsite2 | myUsername2 | myPassword2 |
| myWebsite3 | myUsername3 | myPassword3 |
| myWebsite4 | myUsername4 | myPassword4 |
| myWebsite5 | myUsername5 | myPassword5 |
```

If we only want to decrypt and retrieve the username and password for myWebsite3, we can define data hooks at those specific parts and decrypt them through the console instead of decrypting the whole file on disk and look for them manually:

```
| Website | Username | Password |
|---------|----------|----------|
| myWebsite1 | myUsername1 | myPassword1 |
| myWebsite2 | myUsername2 | myPassword2 |
| myWebsite3 | @web3User {{myUsername3}} | @web3Pass {{myPassword3}} |
| myWebsite4 | myUsername4 | myPassword4 |
| myWebsite5 | myUsername5 | myPassword5 |
```
With the above document, we can use the command `safe decrypt passwords.md --hook website3User` to retrieve `myUsername3` in the console and same goes for `myPassword3`.  
We can also get them both with one command `safe decrypt passwords.md --hook website3User,website3Pass`.

This method, as opposed to the complete file decryption, provides a more efficient way to decrypt specific parts of a document, especially when used with the `--copy` flag. The `--copy` flag is a neat way to convert specific parts of the document into JSON when multiple data hooks are provided.

## Benefits of Non-Overshadowed Data Hooks

```
| Website | Username | Password |
|---------|----------|----------|
| @web1 {{myWebsite1}} | @web1 {{myUsername1}} | @web1 {{myPassword1}} |
| @web2 {{myWebsite2}} | @web2 {{myUsername2}} | @web2 {{myPassword2}} |
| @web3 {{myWebsite3}} | @web3 {{myUsername3}} | @web3 {{myPassword3}} |
| @web4 {{myWebsite4}} | @web4 {{myUsername4}} | @web4 {{myPassword4}} |
| @web5 {{myWebsite5}} | @web5 {{myUsername5}} | @web5 {{myPassword5}} |
```

Using the command `safe decrypt passwords.md --hook web1,web2,web3,web4,web5 -n -c` on the above document will copy the following JSON on the clipboard:

```
{
  "web1":["myWebsite1","myUsername1","myPassword1"],
  "web2":["myWebsite2","myUsername2","myPassword2"],
  "web3":["myWebsite3","myUsername3","myPassword3"],
  "web4":["myWebsite4","myUsername4","myPassword4"],
  "web5":["myWebsite5","myUsername5","myPassword5"]
}
```

# Dependencies

- [commander](https://github.com/tj/commander.js/)
- [q](https://github.com/kriskowal/q)
- [fs-extra](https://github.com/jprichardson/node-fs-extra)
- [readline-sync](https://github.com/anseki/readline-sync)
- [copy-paste](https://github.com/xavi-/node-copy-paste)
- [chalk](https://github.com/chalk/chalk)
