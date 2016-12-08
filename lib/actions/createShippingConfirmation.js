"use strict";

const fetch = require('node-fetch');
const requestOptions = require('../requestOptions.js');

exports.process = function(msg, cfg) {
  let self = this;
  let orderId = parseInt(msg.body.vms.updateOrderStatus.data.id);
  let carrierServiceName = msg.body.webhook.CarrierServiceName;
  let trackingId = msg.body.webhook.ConsignmentTrackingReference;
  let consignmentState = msg.body.webhook.ConsignmentState;

  function createShippingConfirmation(authenticationHeaders) {
    if (consignmentState != "Manifested") {
      console.log(`Consignment status is ${consignmentState}, skipping creation of shipping confirmation.`);
      return Promise.resolve(`Consignment status was ${consignmentState}, shipping confirmation was not created`);
    }

    let requestBody = {
      data: {
        type: "shippingConfirmations",
        attributes: {
          "order-id": orderId,
          "carrier-service": carrierServiceName
        }
      }
    };

    if (trackingId) {
      requestBody.data.attributes['tracking-id'] = trackingId;
    }

    return fetch(`${authenticationHeaders.url}admin/shipping-confirmations`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: authenticationHeaders.headers,
    }).
    then(res => {
      if (res.status != 201) {
        return Promise.reject(new Error(`Creating shipping confirmation failed. VMS responded with status ${res.status}: ${res}`));
      } else {
        return res.json();
      }
    });
  }

  function emitData(data) {
    if (msg.body.vms == undefined) {
      msg.body.vms = {};
    }
    msg.body.vms.createShippingConfirmation = data;
    msg.body.currentMessage = data;
    self.emit('data', msg);
  }

  function emitRebound(e) {
    console.log("Rebounding with error:", e);
    self.emit('rebound', e);
  }

  function emitEnd() {
    self.emit('end');
  }

  requestOptions(cfg)
    .then(createShippingConfirmation)
    .then(emitData)
    .catch(emitRebound)
    .then(emitEnd)
}