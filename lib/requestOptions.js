"use strict";
const Promise = require('promise');

module.exports = requestOptions;

// receives an object containing a host and api_key and returns a set of
// options for making a request
function requestOptions(config) {
  // check our input
  if (!config.host) {
    return Promise.reject(Error("Host is not set"));
  } else if (!config.apiKey) {
    return Promise.reject(Error("API key is not set"));
  }
  
  return Promise.resolve({
    url: `${config.host}/api/v1/`,
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
      'X-Auth-Token': config.apiKey
    },
    timeout: 29000
  });

};