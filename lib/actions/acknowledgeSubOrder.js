"use strict";
const request      = require('request');
const elasticio    = require('elasticio-node');
const requestOptions = require('../requestOptions.js');
const messages     = elasticio.messages;
const Promise       = require('promise');

exports.process = processAction;

function processAction(message, config) {
  let self = this;

  // submits the HTTP request to the VMS to acknowledge the order
  function acknowledgeSubOrder(authenticationHeaders) {
    let id = message.body.id;
    let options = Object.assign({}, authenticationHeaders, {
      url: `${authenticationHeaders.url}sub-orders/${id}`,
      json: true,
      body: { data: { type: 'sub-orders', id: id, attributes: { acknowledge: true } } }
    });

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

    // the callback from a valid HTTP response
  function handleResponse(response) {
    console.log('Handling response from VMS');
    console.log('Status Code:', response.statusCode);
    console.log('Headers:', response.headers);
    console.log('Body:', response.body);
    // if we got a happy response
    if (response.statusCode >= 200 && response.statusCode < 400) {
      return Promise.resolve(response.body);
    // handle authentication / not found errors
    } else if (response.statusCode == 401 || response.statusCode == 403 || response.statusCode == 404) {
      return Promise.reject(Error(`Response status code was ${response.statusCode}, auth may have failed, check log`));
    // handle maintenance errors
    } else if (response.statusCode == 408 || response.statusCode == 429 || response.statusCode == 503 || response.statusCode == 504) {
      return emitRebound(Error(`Retrying...\nResponse status code was ${response.statusCode}`));
    // unknown error
    } else {
      return emitError(Error(`Response status code was ${response.statusCode} not 2XX/3XX, body:\n${response.body}`));
    }
  }

  function emitData(body) {
    let data = messages.newMessageWithBody(body);
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
    then(acknowledgeSubOrder).
    then(handleResponse).
    then(emitData).
    catch(emitError).
    then(emitEnd);
}
