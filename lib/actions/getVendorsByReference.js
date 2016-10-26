"use strict";
const request        = require('request');
const elasticio      = require('elasticio-node');
const requestOptions = require('../requestOptions.js');
const handleResponse = require('../handleResponse.js');
const getVendorReferences  = require('../getVendorsByReference/getVendorReferences.js');
const filterLeadTimes  = require('../getVendorsByReference/filterLeadTimes.js');
const messages       = elasticio.messages;

exports.process = processAction;

function processAction(message, config) {
  let self = this;

  // submits the HTTP request to the VMS to acknowledge the order
  function getVendorsByReference(responses) {
    let authenticationHeaders = responses[0];
    let references = responses[1];
    let options = Object.assign({}, authenticationHeaders, {
      json: true,
      url: `${authenticationHeaders.url}admin/vendors?filter[references]=${references}`
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
    message.body.currentMessage = body;
    if (message.body.vms == undefined) {
      message.body.vms = {};
    }
    message.body.vms.getVendorsByReference = { leadTimes: body };

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

  Promise.all([requestOptions(config), getVendorReferences(message)]).
    then(getVendorsByReference).
    then(handleResponse).
    then(filterLeadTimes).
    then(emitData).
    catch(handleError).
    then(emitEnd);
}
