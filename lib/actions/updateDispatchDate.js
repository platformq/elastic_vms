"use strict";

const fetch = require('node-fetch');
const requestOptions = require('../requestOptions.js');

exports.process = function(msg, cfg) {
  let self = this;
  let orderId = msg.body.webhook.data.id;
  let dispatchDate = msg.body.electio.dispatchDate;

  function updateOrder(authenticationHeaders) {
     let requestBody = {
       data: {
         id: orderId,
         type: "orders",
         attributes: {
           "dispatch-date": dispatchDate
         }
       }
     };

     if (dispatchDate !== null) {
       return fetch(`${authenticationHeaders.url}orders/${orderId}`, {
         method: 'PATCH',
         body: JSON.stringify(requestBody),
         headers: authenticationHeaders.headers
       }).
       then(res => {
         if (res.status != 200) {
           return Promise.reject(new Error(`VMS responded with status ${res.status}: ${res}`));
         } else {
           console.log(`VMS order ${orderId} stored the dispatch date: ${dispatchDate}`);
           return res.json();
         }
       });
     } else {
       return
     }
   }

   function emitData(data) {
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
     .then(updateOrder)
     .then(emitData)
     .catch(emitRebound)
     .then(emitEnd)
}
