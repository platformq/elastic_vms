"use strict";
const request        = require('request');
const requestOptions = require('../requestOptions.js');
const handleResponse = require('../handleResponse.js');
const updateLineItem = require('../updateLineItemPackages/updateLineItem.js');

exports.process = processAction;

function processAction(message, config) {
  let self = this;

  // submits the HTTP request to the VMS to update line item packages
  function updateLineItemPackages(authenticationHeaders) {
    let lineItems = message.body.webhook.included.filter(item => item.type == 'line-items');
    let packages = message.body.shopify.packageNumbers;

    let lineItemPromises = lineItems.map(lineItem => {
      let lineItemPackages = packages[lineItem.attributes.sku];
      return updateLineItem(lineItem, lineItemPackages, authenticationHeaders);
    });

    return Promise.all(lineItemPromises);
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
    then(updateLineItemPackages).
    then(handleResponse).
    then(emitData).
    catch(handleError).
    then(emitEnd);
}
