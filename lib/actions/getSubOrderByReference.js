"use strict";
const request        = require('request');
const requestOptions = require('../requestOptions.js');
const handleResponse = require('../handleResponse.js');

exports.process = processAction;

function processAction(message, config) {
  let self = this;

  function getSubOrderByReference(authenticationHeaders) {
    let { orderReference } = message.body.currentMessage;
    let options = Object.assign({}, authenticationHeaders, {
      json: true,
      url: `${authenticationHeaders.url}sub-orders?include=line-items&filter[reference]=${orderReference}`
    });

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

  function handleError(response) {
    if (response.statusCode == 408 || response.statusCode == 429 || response.statusCode == 503 || response.statusCode == 504) {
      emitRebound(Error(`Retrying...\nResponse status code was ${response.statusCode}`));
    } else {
      emitRebound(Error(`Response status code was ${response.statusCode} not 2XX/3XX, body:\n${response.body}`));
    }
  }

  function emitData(response) {
    let body = response.body;
    message.body.currentMessage = body;
    if (message.body.vms == undefined) {
      message.body.vms = {};
    }
    message.body.vms.getSubOrderByReference = { vmsSubOrder: body };
    console.log('Emitting data: ', message);
    self.emit('data', message);
    return Promise.resolve(message);
  }

  function emitError(error) {
    console.log('An error occurred:', error);
    self.emit('error', error);
    return Promise.resolve();
  }

  function emitRebound(error) {
    console.log('An error occurred:', error);
    self.emit('rebound', error);
    return Promise.resolve();
  }

  function emitEnd() {
    console.log('Finished execution');
    self.emit('end');
  }

  requestOptions(config).
    then(getSubOrderByReference).
    then(handleResponse).
    then(emitData).
    catch(handleError).
    then(emitEnd);
}