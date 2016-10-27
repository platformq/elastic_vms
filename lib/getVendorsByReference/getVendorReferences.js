"use strict";

module.exports = getVendorReferences;

function getVendorReferences(message) {
  console.log('Getting vendor references');
  let vendors = [];

  message.body.webhook.included.forEach((include) => {
    if (include.type == 'sub-orders') {
      vendors.push(include.attributes.vendor)
    }
  })

  vendors.join(',');

  return Promise.resolve(vendors);
}