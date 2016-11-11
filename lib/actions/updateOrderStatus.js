"use strict";

const fetch = require('node-fetch');
const requestOptions = require('../requestOptions.js');

exports.process = function(msg, cfg) {
  const self = this;

  const consignmentReference = msg.body.ConsignmentReference;
  const newStatus = toHumanReadable(msg.body.ConsignmentState);

  function toHumanReadable(status) {
    let readableStatus = status.match(/^[a-z]+|[A-Z][a-z]*/g).map(word => word.toLowerCase()).join(' ');
    return readableStatus[0].toUpperCase() + readableStatus.slice(1);
  }

  function updateOrderStatus(authenticationHeaders) {
    return fetch(`${authenticationHeaders.url}orders?filter[consignment_reference]=${consignmentReference}`, {
      headers: authenticationHeaders.headers,
    }).
    then(res => {
      if (res.status != 200) {
        return Promise.reject(new Error(`Filtering orders by consignment reference failed. VMS responded with status ${res.status}: ${res}`));
      } else {
        return res.json();
      }
    }).
    then(json => {
      let orderId = json.data[0].id;

      let requestBody = {
        data: {
          id: orderId,
          type: "orders",
          attributes: {
            "dms-status": newStatus
          }
        }
      };

      return fetch(`${authenticationHeaders.url}orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: authenticationHeaders.headers,
      }).
      then(res => {
        if (res.status != 200) {
          return Promise.reject(new Error(`Updating order status failed. VMS responded with status ${res.status}: ${res}`));
        } else {
          return res.json();
        }
      })
    });
  }

  function emitData() {
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
    .then(updateOrderStatus)
    .then(emitData)
    .catch(emitRebound)
    .then(emitEnd)
};