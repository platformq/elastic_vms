"use strict";
const request = require('request');
const requestOptions = require('./lib/requestOptions.js');

module.exports = verify;

function verify(config, cb) {
  console.log('Verifying credentials...');

  function makeRequest(authenticationHeaders) {
    let options = Object.assign({}, authenticationHeaders, {
      url: `${authenticationHeaders.url}sub-orders`
    });

    console.log(options);

    return new Promise((resolve, reject) => {
      request.get(options, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  function parseResponse(response) {
    if (response.statusCode < 400) {
      return Promise.resolve();
    } else {
      return Promise.reject(Error(`Response status code was ${response.statusCode}, should be 2XX/3XX`));
    }
  }

  requestOptions(config).then(makeRequest).then(parseResponse).then(function() {
    console.log('Successfully verified credentials');
    cb(null, { verified: true });
  }).catch((error) => {
    console.log('Credentials verification failed, reason:', error.message);
    cb(null, { verified: false });
  });
}