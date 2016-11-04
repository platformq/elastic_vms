"use strict";
const request = require('request');

module.exports = updateLineItem;

function updateLineItem(...args) {
  let [ lineItem, lineItemPackages, authenticationHeaders ] = args
  let id = parseInt(lineItem.id);

  let options = Object.assign({}, authenticationHeaders, {
    url: `${authenticationHeaders.url}line-items/${id}`,
    json: true,
    body: { data: { type: 'line-items', id: id, attributes: { packages: lineItemPackages } } }
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