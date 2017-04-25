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
    return Promise.all([
      fetch(`${authenticationHeaders.url}orders?filter[consignment_reference]=${consignmentReference}`, {
        headers: authenticationHeaders.headers,
      }),
      fetch(`${authenticationHeaders.url}admin/returns?filter[dms_reference]=${consignmentReference}`, {
        headers: authenticationHeaders.headers,
      })
    ]).
    then(([resOrder, resReturn]) => {
      if (resOrder.status != 200) {
        return Promise.reject(new Error(`Filtering orders by consignment reference failed. VMS responded with status ${resOrder.status}: ${resOrder}`));
      } else if (resReturn.status != 200) {
        return Promise.reject(new Error(`Filtering returns by consignment reference failed. VMS responded with status ${resReturn.status}: ${resReturn}`));
      } else {
        return Promise.all([resOrder.json(), resReturn.json()])
      }
    }).
    then(([jsonOrder, jsonReturn]) => {
      return Promise.all([
          updateOrder(jsonOrder, authenticationHeaders),
          updateReturn(jsonReturn, authenticationHeaders)
      ])
    })
  }

  function updateOrder (json, authenticationHeaders) {
    if (json.data.length === 0) {
      console.log(`Order with DMS reference ${consignmentReference} does not exist. Skipping execution.`)
      return {}
    }

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
  }

  function updateReturn (json, authenticationHeaders) {
    if (json.data.length === 0) {
      console.log(`Return with DMS reference ${consignmentReference} does not exist. Skipping execution.`)
      return {}
    }

    let returnId = json.data[0].id;

    let requestBody = {
      data: {
        id: returnId,
        type: "returns",
        attributes: {
          "dms-status": newStatus
        }
      }
    };

    return fetch(`${authenticationHeaders.url}admin/returns/${returnId}`, {
      method: 'PATCH',
      body: JSON.stringify(requestBody),
      headers: authenticationHeaders.headers,
    }).
    then(res => {
      if (res.status != 200) {
        return Promise.reject(new Error(`Updating return status failed. VMS responded with status ${res.status}: ${res}`));
      } else {
        return res.json();
      }
    })
  }


  function emitData(data) {
    msg.body = {
      webhook: msg.body
    };
    if (msg.body.vms == undefined) {
      msg.body.vms = {};
    }
    msg.body.vms.updateOrderStatus = data;
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
    .then(updateOrderStatus)
    .then(emitData)
    .catch(emitRebound)
    .then(emitEnd)
};
