"use strict";
const request        = require('request');
const requestOptions = require('../requestOptions.js');
const handleResponse = require('../handleResponse.js');

exports.process = processAction;

function processAction(message, config) {
  let self = this;

  // submits the HTTP request to the VMS to acknowledge the order
  function acknowledgeSubOrder(authenticationHeaders) {
    let id = parseInt(message.body.currentMessage.data.id);
    if (isNaN(id)) {
      id = parseInt(message.body.currentMessage.data[0].id)
    }

    let options = Object.assign({}, authenticationHeaders, {
      url: `${authenticationHeaders.url}sub-orders/${id}`,
      json: true,
      body: { data: { type: 'sub-orders', id: id, attributes: { acknowledge: true } } }
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

  function emitData(body) {
    message.body.currentMessage = body;
    if (message.body.vms == undefined) {
      message.body.vms = {};
    }
    message.body.vms.acknowledgeSubOrder = { vmsSubOrderReference: body };

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
    then(acknowledgeSubOrder).
    then(handleResponse).
    then(emitData).
    catch(handleError).
    then(emitEnd);
}
