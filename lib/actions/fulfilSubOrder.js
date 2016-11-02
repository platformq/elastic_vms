"use strict";
const request        = require('request');
const requestOptions = require('../requestOptions.js');
const handleResponse = require('../handleResponse.js');
const util           = require('util')

exports.process = processAction;

function processAction(message, config) {
  let self = this;

  // submits the HTTP request to the VMS to fulfil the order
  function fulfilSubOrder(authenticationHeaders) {
    let subOrder = message.body.currentMessage.data
    if (Array.isArray(subOrder)) {
      subOrder = subOrder[0]
    }
    let id = parseInt(subOrder.attributes['order-id']);
    let lineItems = message.body.currentMessage.included
                    .filter(item => item.type == 'line-items')
                    .map(lineItem => {
                      return {
                        "line-item-id": parseInt(lineItem.id),
                        "quantity": parseInt(lineItem.attributes.quantity)
                      }
                    });

    let options = Object.assign({}, authenticationHeaders, {
      url: `${authenticationHeaders.url}fulfilments`,
      json: true,
      body: { 
        data: {  
          attributes: {
            "order-id": id,
            "tracking-company": "",
            "tracking-url": "",
            "tracking-number": "",
            "fulfilment-lines-attributes": lineItems
          },
          type: "fulfilments" 
        } 
      }
    });
    console.log(util.inspect(options, false, null))

    return new Promise((resolve, reject) => {
      request.post(options, (error, response, body) => {
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
    console.log('response', response);
    let body = response.body;

    message.body.currentMessage = body;
    if (message.body.vms == undefined) {
      message.body.vms = {};
    }
    message.body.vms.fulfilSubOrder = { vmsSubOrderFulfilment: body };

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
    then(fulfilSubOrder).
    then(handleResponse).
    then(emitData).
    catch(handleError).
    then(emitEnd);
}
