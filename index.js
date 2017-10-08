#!/usr/bin/env node
'use strict';

const program = require('commander');
const fs = require('fs-extra');
const input = require('readline-sync');
const crypto = require('crypto');

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

      let password = input.question('Key: ', { hideEchoBack: true });
      let cipher = crypto.createCipher('aes-256-ctr', password);
      let encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
      let destination = `${file}.safe`;

      fs.outputFile(destination, encrypted)

      .then( () => {

        console.log(`File was encrypted at: ${destination}`);

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

let decrypt = (file, options) => {

  if ( file.substr(file.length - 5) !== '.safe' ) {

    console.error('Only SAFE files can be decrypted!');

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

      let password = input.question('Key: ', { hideEchoBack: true });
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

program
  .command('encrypt <file>')
  .description('Encrypts the given file')
  .option('-t, --temp', 'Keeps the process alive and deletes the encrypted file after user hits ENTER')
  .option('-s, --swap', 'Swaps the original file with the encrypted result')
  .action(encrypt);

program
  .command('decrypt <file>')
  .description('Decripts the given file')
  .option('-t, --temp', 'Keeps the process alive and deletes the decrypted file after user hits ENTER')
  .option('-s, --swap', 'Swaps the original file with the decrypted result')
  .action(decrypt);

program.parse(process.argv);

if ( ! program.args.length ) program.help();
