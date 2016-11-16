"use strict";
const request        = require('request');
const requestOptions = require('../requestOptions.js');
const handleResponse = require('../handleResponse.js');

exports.process = processAction;

function processAction(message, config) {
  let self = this;

  // submits the HTTP request to the VMS to fulfil the order
  function getVariantsBySku(authenticationHeaders) {
    let skus = message.body.currentMessage;

    skus = skus.map(sku => sku.sku).join(',');

    let options = Object.assign({}, authenticationHeaders, {
      json: true,
      url: `${authenticationHeaders.url}variants?filter[sku]=${skus}&fields[variants]=sku,inventory-quantity`
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

  function filterVariants(response) {
    let skus = message.body.currentMessage;
    let variants = response.body.data;

    let filteredVariants = variants.reduce((variants, variant) => {
      let sku = skus.find(sku => sku.sku == variant.attributes.sku);

      if (sku && variant.attributes['inventory-quantity'] != sku.quantity) {
        return variants.concat(variant);
      } else {
        return variants;
      }
    }, []);
    console.log('filtered', filteredVariants);
    return Promise.resolve(filteredVariants);
  }

  function handleError(response) {
    if (response.statusCode == 408 || response.statusCode == 429 || response.statusCode == 503 || response.statusCode == 504) {
      return emitRebound(Error(`Retrying...\nResponse status code was ${response.statusCode}`));
    } else {
      return emitRebound(Error(`Response status code was ${response.statusCode} not 2XX/3XX, body:\n${response.body}`));
    }
  }

  function emitData(variants) {
    console.log('response', variants);

    message.body.currentMessage = variants;
    if (message.body.vms == undefined) {
      message.body.vms = {};
    }
    message.body.vms.getVariantsBySku = { vmsVariants: variants };

    console.log('Emitting data: ', message)
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
    then(getVariantsBySku).
    then(handleResponse).
    then(filterVariants).
    then(emitData).
    catch(handleError).
    then(emitEnd);
}
