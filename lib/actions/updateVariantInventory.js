"use strict";
const request        = require('request');
const requestOptions = require('../requestOptions.js');
const handleResponse = require('../handleResponse.js');

exports.process = processAction;

function processAction(message, config) {
  let self = this;

  // submits the HTTP request to the VMS to update line item packages
  function updateVariantInventory(authenticationHeaders) {
    let id = parseInt(message.body.currentMessage.id);
    let inventoryQuantity = parseInt(message.body.currentMessage.attributes['inventory-quantity'])

    let options = Object.assign({}, authenticationHeaders, {
      url: `${authenticationHeaders.url}variants/${id}`,
      json: true,
      body: { data: { type: 'variants', id: id, attributes: { "inventory-quantity": inventoryQuantity } } }
    });
    console.log(options);

    return new Promise((resolve, reject) => {
      request.patch(options, (error, response, body) => {
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
      return emitRebound(Error(`Response status code was ${response.statusCode} not 2XX/3XX, body:\n${response.body}`));
    }
  }

  function emitData(response) {
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
    then(updateVariantInventory).
    then(handleResponse).
    then(emitData).
    catch(handleError).
    then(emitEnd);
}
