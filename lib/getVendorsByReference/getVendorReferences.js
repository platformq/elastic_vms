"use strict";

module.exports = getVendorReferences;

function getVendorReferences(message) {
  console.log('Getting vendor references');
  let vendors = [];

  if (message.body.webhook) {
    message.body.webhook.included.forEach((include) => {
      if (include.type == 'sub-orders') {
        vendors.push(include.attributes.vendor)
      }
    })
  } else {
    vendors = message.body.vendorsForLeadTimes
  }

  return Promise.resolve(vendors);
}