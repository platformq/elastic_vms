"use strict";

module.exports = handleResponse;

function handleResponse(response) {
  console.log('Handling response from VMS');
  console.log('Status Code:', response.statusCode);
  console.log('Headers:', response.headers);
  console.log('Body:', response.body);
  // if we got a happy response
  if (response.statusCode >= 200 && response.statusCode < 400) {
    return Promise.resolve(response);
  } else {
    return Promise.reject(response);
  }
}