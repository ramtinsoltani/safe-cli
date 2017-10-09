#!/usr/bin/env node
'use strict';

const program = require('commander');
const fs = require('fs-extra');
const input = require('readline-sync');
const crypto = require('crypto');
const clipboard = require('copy-paste');

process.stdin.resume();

let encrypt = (file, options) => {

  fs.pathExists(file)

  .then( exists => {

    if ( ! exists ) {

      console.error(`File does not exist at ${file}!`);

      process.exit();

      return;

    }

    fs.readFile(file, (error, data) => {

      if ( error ) {

        console.error(error);

        process.exit();

        return;

      }

      if ( ! data || ! data.length ) {

        console.error('The file is empty!');

        process.exit();

        return;

      }

      let password = input.question('Key: ', { hideEchoBack: !(options.R || options.reveal) });
      let cipher = crypto.createCipher('aes-256-ctr', password);
      let encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
      let destination = `${file}.safe`;

      fs.outputFile(destination, encrypted)

      .then( () => {

        console.log(`File was encrypted at: ${destination}`);

        if ( options.S || options.swap ) {

          fs.removeSync(file);

        }

      })

      .catch( error => {

        console.error(error);

        process.exit();

      });

    });

  });

};

let decrypt = (file, options) => {

  if ( file.substr(file.length - 5) !== '.safe' ) {

    console.error('Only SAFE files can be decrypted!');

    process.exit();

    return;

  }

  if ( (options.T || options.temp) && (options.S || options.swap) ) {

    console.error('The temp and swap flags cannot be used at the same time!');

    process.exit();

    return;

  }

  fs.pathExists(file)

  .then( exists => {

    if ( ! exists ) {

      console.error(`File does not exist at ${file}!`);

      process.exit();

      return;

    }

    fs.readFile(file, 'utf8', (error, data) => {

      if ( error ) {

        console.error(error);

        process.exit();

        return;

      }

      if ( ! data || ! data.length ) {

        console.error('The file is empty!');

        process.exit();

        return;

      }

      let password = input.question('Key: ', { hideEchoBack: !(options.R || options.reveal) });
      let decipher = crypto.createDecipher('aes-256-ctr', password);
      let decrypted = decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
      let destination = file.substr(0, file.length - 5);

      fs.outputFile(destination, decrypted)

      .then( () => {

        console.log(`File was decrypted at: ${destination}`);

        if ( options.S || options.swap ) {

          fs.removeSync(file);

        }
        else if ( options.T || options.temp ) {

          process.on('exit', fs.removeSync.bind(null, destination));
          process.on('SIGINT', fs.removeSync.bind(null, destination));
          process.on('SIGUSR1', fs.removeSync.bind(null, destination));
          process.on('SIGUSR2', fs.removeSync.bind(null, destination));

          input.question('PRESS ENTER TO DELETE THE ENCRYPTED FILE...\n');

          process.exit();

        }

      })

      .catch( error => {

        console.error(error);

        process.exit();

      });

    });

  });

};

let generate = (length, options) => {

  length = parseInt(length);

  if ( ! length || length < 1 ) length = 10;

  if ( (options.U || options.upper) && (options.L || options.lower) ) {

    console.error('The lower and upper flags cannot be used at the same time!');

    process.exit();

    return;

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

    console.log('The generated string was copied to clipboard');

  }
  else {

    console.log(generated);

  }

  process.exit();

};

program
  .command('encrypt <file>')
  .description('Encrypts the given file')
  .option('-s, --swap', 'Swaps the original file with the encrypted result')
  .option('-r --reveal', 'Reveals the user password input')
  .action(encrypt);

program
  .command('decrypt <file>')
  .description('Decrypts the given file')
  .option('-t, --temp', 'Keeps the process alive and deletes the decrypted file after user hits ENTER')
  .option('-s, --swap', 'Swaps the original file with the decrypted result')
  .option('-r --reveal', 'Reveals the user password input')
  .action(decrypt);

program
  .command('generate [length]')
  .description('Generates a random string including lower and upper case characters and digits, useful for passwords')
  .option('-c --copy', 'Copies the generated string to clipboard')
  .option('-s --special', 'The generated string might include special characters')
  .option('-n --nodigits', 'The generated string won\'t include digits')
  .option('-u --upper', 'Uppercase letters only')
  .option('-l --lower', 'Lowercase letters only')
  .option('-w --space', 'The generated string might include spaces')
  .action(generate);

program.parse(process.argv);

if ( ! program.args.length ) program.help();
