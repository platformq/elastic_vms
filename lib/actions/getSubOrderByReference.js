"use strict";
const request        = require('request');
const elasticio      = require('elasticio-node');
const requestOptions = require('../requestOptions.js');
const handleResponse = require('../handleResponse.js');
const messages       = elasticio.messages;
const Promise        = require('promise');

exports.process = processAction;

function processAction(message, config) {
  let self = this;

  function getSubOrderByReference(authenticationHeaders) {
    let orderReference = message.body.vmsSubOrderReference;
    let options = Object.assign({}, authenticationHeaders, {
      url: `${authenticationHeaders.url}sub-orders?filter[reference]=${orderReference}`
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
      return emitRebound(Error(`Retrying...\nResponse status code was ${response.statusCode}`));
    } else {
      return emitError(Error(`Response status code was ${response.statusCode} not 2XX/3XX, body:\n${response.body}`));
    }
  }

  function emitData(body) {
    let data = Object.assign({}, message, {
      body: {
        vmsSubOrders: body
      }
    });
    console.log('Emitting data: ', data);
    self.emit('data', data);
    return Promise.resolve(data);
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