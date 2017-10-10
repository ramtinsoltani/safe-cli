#!/usr/bin/env node
'use strict';

const program = require('commander');
const q = require('q');
const fs = require('fs-extra');
const input = require('readline-sync');
const crypto = require('crypto');
const clipboard = require('copy-paste');
const chalk = require('chalk');

process.stdin.resume();

function Safe() {

  let that = this;

  this.util = {

    keyPrompt: reveal => {

      let key = '', repeat = '';

      while ( (! key && ! repeat) || repeat !== key ) {

        key = input.question('Enter a key:      ', { hideEchoBack: ! reveal });

        if ( ! key ) {

          console.log(chalk.red('A key is required for the encryption!'));

          continue;

        }

        while ( ! repeat ) {

          repeat = input.question('Re-enter the key: ', { hideEchoBack: ! reveal });

          if ( ! repeat ) {

            console.log(chalk.red('You must re-enter the key to start the decryption!'));

            continue;

          }

        }

        if ( repeat !== key ) {

          console.log(chalk.yellow('Keys do not match!'));

          key = '';
          repeat = '';

        }

      }

      return key;

    },

    fileExists: file => {

      let deferred = q.defer();

      fs.pathExists(file)

      .then(exists => {

        if ( ! exists ) deferred.reject(`File does not exist at ${file}!`);
        else deferred.resolve();

      });

      return deferred.promise;

    },

    readFile: file => {

      let deferred = q.defer();

      fs.readFile(file, 'utf8', (error, data) => {

        if ( error ) {

          deferred.reject(error);

        }
        else {

          if ( ! data || ! data.length ) deferred.reject('The file is empty!');
          else deferred.resolve(data);

        }

      });

      return deferred.promise;

    },

    writeFile: (path, data) => {

      let deferred = q.defer();

      fs.outputFile(path, data)

      .then(() => {

        deferred.resolve(path);

      })
      .catch(error => {

        deferred.reject(error);

      });

      return deferred.promise;

    },

    removeFile: file => {

      let deferred = q.defer();

      fs.remove(file)

      .then(() => {

        deferred.resolve();

      })

      .catch(error => {

        deferred.reject(error);

      });

      return deferred.promise;

    },

    detectAlias: (data, alias, noOvershadow) => {

      let regex = new RegExp(`@ *${alias.trim()} *{{(.*?)}}`, 'gi');
      let match, matches = [];

      if ( noOvershadow ) {

        do {

          match = regex.exec(data);

          if ( match ) {

            matches.push(match[1] === '' ? undefined : match[1]);

          }

        }
        while ( match );

        if ( ! matches.length ) return null;

        return matches.length > 1 ? matches : matches[0];

      }
      else {

        match = regex.exec(data);

        if ( ! match ) return null;

        return (match[1] === '' ? undefined : match[1]);

      }

    }

  };

  this.core = {

    encrypt: (file, options) => {

      that.util.fileExists(file)

      .then(() => {

        return that.util.readFile(file);

      })

      .then(data => {

        let key = that.util.keyPrompt(options.R || options.reveal);
        let cipher = crypto.createCipher('aes-256-ctr', key);
        let encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
        let destination = `${file}.safe`;

        return that.util.writeFile(destination, encrypted);

      })

      .then(path => {

        console.log(chalk.green(`File was encrypted at: ${path}`));

        if ( options.S || options.swap ) return that.util.removeFile(file);
        else return q.fcall(() => { return; });

      })

      .catch(error => {

        console.log(chalk.red(error));

        process.exit();

      })

      .done();

    },

    decrypt: (file, options) => {

      if ( file.substr(file.length - 5) !== '.safe' ) {

        file += '.safe';

      }

      if ( (options.T || options.temp) && (options.S || options.swap) ) {

        console.log(chalk.yellow('The temp and swap flags cannot be used at the same time!'));

        process.exit();

      }

      if ( (options.A || options.aliases) && (options.S || options.swap) ) {

        console.log(chalk.yellow('The aliases and swap flags cannot be used at the same time!'));

        process.exit();

      }

      if ( (options.A || options.aliases) && (options.T || options.temp) ) {

        console.log(chalk.yellow('The temp and aliases flags cannot be used at the same time!'));

        process.exit();

      }

      that.util.fileExists(file)

      .then(() => {

        return that.util.readFile(file);

      })

      .then(data => {

        let key = that.util.keyPrompt(options.R || options.reveal);
        let decipher = crypto.createDecipher('aes-256-ctr', key);
        let decrypted = decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');

        if ( options.A || options.aliases ) {

          let aliases = {};
          let deferred = q.defer();

          deferred.reject(null);

          options.aliases.split(',').forEach(alias => {

            if ( ! alias.trim() ) {

              console.log(chalk.red(`Alias is undefined!`));

              return;

            }

            let value = that.util.detectAlias(decrypted, alias, options.N || options.noshadow);

            if ( typeof value === 'object' && value !== null ) {

              let undefinedCounter = 0;

              for ( let index = 0; index < value.length; index++ ) {

                if ( value[index] === undefined ) {

                  value.splice(index, 1);

                  index--;
                  undefinedCounter++;

                }

              }

              if ( undefinedCounter ) console.log(chalk.yellow(
                `Alias ${alias.trim()} has ${undefinedCounter} undefined value${undefinedCounter > 1 ? 's' : ''}!`
              ));

              if ( ! value.length ) return;

              if ( value.length === 1 ) value = value[0];

            }
            else if ( value === null ) {

              console.log(chalk.yellow(`Alias ${alias.trim()} not found!`));

              return;

            }
            else if ( value === undefined ) {

              console.log(chalk.yellow(`The value of ${alias.trim()} is undefined!`));

              return;

            }

            aliases[alias.trim()] = value;

          });

          if ( ! Object.keys(aliases).length ) return deferred.promise;

          if ( Object.keys(aliases).length > 1 ) {

            if ( options.C || options.copy ) {

              clipboard.copy(JSON.stringify(aliases));

              console.log(chalk.green(`The values of the found aliases were copied to the clipboard`));

            }
            else {

              for ( let alias in aliases ) {

                console.log(chalk.white(`${alias}: `) + chalk.cyan(
                  typeof aliases[alias] === 'object' ? aliases[alias].join(', ') : aliases[alias]
                ));

              }

            }

          }
          else {

            let singleValue = Object.values(aliases)[0];

            if ( options.C || options.copy ) {

              clipboard.copy(
                typeof singleValue === 'object' ? singleValue.join(', ') : singleValue
              );

              console.log(chalk.green(`The value of alias ${
                typeof singleValue === 'object' ? singleValue.join(', ') : singleValue
              } was copied to the clipboard`));

            }
            else {

              console.log(chalk.cyan(
                typeof singleValue === 'object' ? singleValue.join(', ') : singleValue
              ));

            }

          }

          return deferred.promise;

        }
        else {

          return that.util.writeFile(file.substr(0, file.length - 5), decrypted);

        }

      })

      .then(path => {

        console.log(chalk.green(`File was decrypted at: ${path}`));

        if ( options.S || options.swap ) {

          return that.util.removeFile(file);

        }
        else if ( options.T || options.temp ) {

          // Using a variable to hold the path (the parameter will be out-of-scope at the time of fs.removeSync's execution)
          let target = path;

          process.on('exit', fs.removeSync.bind(null, target));
          process.on('SIGINT', fs.removeSync.bind(null, target));
          process.on('SIGUSR1', fs.removeSync.bind(null, target));
          process.on('SIGUSR2', fs.removeSync.bind(null, target));

          input.question(chalk.cyan('PRESS ENTER TO DELETE THE ENCRYPTED FILE...'));

          process.exit();

        }
        else {

          return q.fcall(() => { return; });

        }

      })

      .catch(error => {

        if ( error === null ) return;

        console.log(chalk.red(error));

        process.exit();

      })

      .done();

    },

    generate: (length, options) => {

      length = parseInt(length);

      if ( ! length || length < 1 ) length = 10;

      if ( (options.U || options.upper) && (options.L || options.lower) ) {

        console.log(chalk.yellow('The lower and upper flags cannot be used at the same time!'));

        process.exit();

      }

      let finalSet = [];
      let generated = '';
      let characterSets = {

        lower: 'abcdefghijklmnopqrstuvwxyz',
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        digits: '0123456789',
        special: `\`~!@#$%^&*()-=_+,.<>/?;:'"[]{}\\|`,
        space: ' '

      };

      if ( options.L || options.lower ) delete characterSets.upper;
      if ( options.U || options.upper ) delete characterSets.lower;
      if ( options.N || options.nodigits ) delete characterSets.digits;
      if ( ! options.S && ! options.special ) delete characterSets.special;
      if ( ! options.W && ! options.space ) delete characterSets.space;

      for ( let set in characterSets ) {

        finalSet = finalSet.concat(characterSets[set].split(''));

      }

      while ( generated.length < length ) {

        let random = Math.round(Math.random() * (finalSet.length - 1));

        generated += finalSet[random];

      }

      if ( options.C || options.copy ) {

        clipboard.copy(generated);

        console.log(chalk.green('The generated string was copied to clipboard'));

      }
      else {

        console.log(chalk.cyan(generated));

      }

      process.exit();

    }

  };

};

let safe = new Safe();

program
  .command('encrypt <file>')
  .description('Encrypts the given file')
  .option('-s, --swap', 'Swaps the original file with the encrypted result')
  .option('-r --reveal', 'Reveals the user key input')
  .action(safe.core.encrypt);

program
  .command('decrypt <file>')
  .description('Decrypts the given file')
  .option('-t, --temp', 'Keeps the process alive and deletes the decrypted file after user hits ENTER')
  .option('-s, --swap', 'Swaps the original file with the decrypted result')
  .option('-r --reveal', 'Reveals the user key input')
  .option('-a --aliases <values>', 'Decrypts specific parts of the file marked by the given aliases')
  .option('-c --copy', 'Copies the decryption result in clipboard (only works with the --aliases flag)')
  .option('-n --noshadow', 'Disables alias overshadowing')
  .action(safe.core.decrypt);

program
  .command('generate [length]')
  .description('Generates a random string including lower and upper case characters and digits, useful for passwords')
  .option('-c --copy', 'Copies the generated string to clipboard')
  .option('-s --special', 'The generated string might include special characters')
  .option('-n --nodigits', 'The generated string won\'t include digits')
  .option('-u --upper', 'Uppercase letters only')
  .option('-l --lower', 'Lowercase letters only')
  .option('-w --space', 'The generated string might include spaces')
  .action(safe.core.generate);

program.parse(process.argv);

if ( ! program.args.length ) program.help();
