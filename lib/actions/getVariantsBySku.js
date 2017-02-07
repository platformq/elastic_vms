'use strict'
const fetch = require('node-fetch')
const requestOptions = require('../requestOptions.js')
const messages = require('elasticio-node').messages

exports.process = processAction

function processAction (message, config) {
  let self = this

  function getVariantsBySku (authenticationHeaders) {
    let skus = message.body.currentMessage.map(sku => sku.sku)
    let skuCount = skus.length
    let limit = 100
    let pages = Math.ceil(skuCount / limit)
    let queries = []

    for (let i = 0; i < pages; i++) {
      let skuList = skus.slice(i * limit, (i + 1) * limit).join(',')
      let url = `${authenticationHeaders.url}variants?filter[sku]=${skuList}&fields[variants]=sku,inventory-quantity`
      let options = {
        headers: authenticationHeaders.headers,
        method: 'get'
      }

      queries.push(fetch(url, options).then(response => {
        if (response.status !== 200) {
          console.log('here')
          return Promise.reject(response)
        } else {
          return response.json()
        }
      }))
    }
    return Promise.all(queries)
  }

  function filterVariants (responses) {
    let variants = []
    responses.forEach(response => {
      variants = variants.concat(response.data)
    })
    let skus = message.body.currentMessage

    let filteredVariants = variants.reduce((variants, variant) => {
      let sku = skus.find(sku => sku.sku === variant.attributes.sku)

      if (sku && variant.attributes['inventory-quantity'] != sku.quantity) {
        return variants.concat(variant)
      } else {
        return variants
      }
    }, [])
    return Promise.resolve(filteredVariants)
  }

  function handleError (response) {
    if (response.status === 408 || response.status === 429 || response.status === 503 || response.status === 504) {
      return emitRebound(Error(`Retrying...\nResponse status code was ${response.status}`))
    } else {
      return emitError(Error(`Response status code was ${response.status} not 2XX/3XX, body:\n${response}`))
    }
  }

  function emitData (variants) {
    variants.forEach(variant => {
      let payload = {
        currentMessage: variant
      }

      console.log('Emitting data: ', payload)
      self.emit('data', messages.newMessageWithBody(payload))
    })
  }

  function emitError (error) {
    console.log('An error occurred:', error)
    self.emit('error', error)
    return Promise.resolve()
  }

  function emitRebound (error) {
    console.log('An error occurred:', error)
    self.emit('rebound', error)
    return Promise.resolve()
  }

  function emitEnd () {
    console.log('Finished execution')
    self.emit('end')
  }

  requestOptions(config)
    .then(getVariantsBySku)
    .then(filterVariants)
    .then(emitData)
    .catch(handleError)
    .then(emitEnd)
}
