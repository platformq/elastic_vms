'use strict'

const fetch = require('node-fetch')
const requestOptions = require('../requestOptions.js')

exports.process = function (msg, cfg) {
  let self = this
  let subOrderIds = msg.body.webhook.data.relationships['sub-orders'].data.map(data => data.id)

  function updateSubOrders (authenticationHeaders) {
    return Promise.all(subOrderIds.map(subOrderId => {
      let requestBody = {
        data: {
          id: subOrderId,
          type: 'sub-orders',
          attributes: {
            'needs-reprinting': true
          }
        }
      }

      return fetch(`${authenticationHeaders.url}sub-orders/${subOrderId}`, {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: authenticationHeaders.headers
      })
      .then(res => {
        if (res.status !== 200) {
          return Promise.reject(new Error(`VMS responded with status ${res.status}: ${res}`))
        } else {
          console.log(`VMS sub-order ${subOrderId} updated needs_reprinting to true`)
          return res.json()
        }
      })
    }))
  }

  function emitData (data) {
    self.emit('data', msg)
  }

  function emitRebound (e) {
    console.log('Rebounding with error:', e)
    self.emit('rebound', e)
  }

  function emitEnd () {
    self.emit('end')
  }

  requestOptions(cfg)
    .then(updateSubOrders)
    .then(emitData)
    .catch(emitRebound)
    .then(emitEnd)
}
