'use strict'
const request = require('request')
const requestOptions = require('../requestOptions.js')
const handleResponse = require('../handleResponse.js')
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
      let options = Object.assign({}, authenticationHeaders, {
        json: true,
        url: `${authenticationHeaders.url}variants?filter[sku]=${skuList}&fields[variants]=sku,inventory-quantity`
      })

      queries.push(new Promise((resolve, reject) => {
        request.get(options, (error, response, body) => {
          if (error) {
            reject(error)
          } else {
            resolve(response)
          }
        })
      }))
    }
    return Promise.all(queries)
  }

  function filterVariants (response) {
    let skus = message.body.currentMessage
    let variants = response.body.data

    let filteredVariants = variants.reduce((variants, variant) => {
      let sku = skus.find(sku => sku.sku === variant.attributes.sku)

      if (sku && variant.attributes['inventory-quantity'] !== sku.quantity) {
        return variants.concat(variant)
      } else {
        return variants
      }
    }, [])
    return Promise.resolve(filteredVariants)
  }

  function handleError (response) {
    if (response.statusCode === 408 || response.statusCode === 429 || response.statusCode === 503 || response.statusCode === 504) {
      return emitRebound(Error(`Retrying...\nResponse status code was ${response.statusCode}`))
    } else {
      console.log(response)
      return emitError(Error(`Response status code was ${response.statusCode} not 2XX/3XX, body:\n${response.body}`))
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
    .then(handleResponse)
    .then(filterVariants)
    .then(emitData)
    .catch(handleError)
    .then(emitEnd)
}
