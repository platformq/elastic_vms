'use strict'

const getVariantsBySku = require('../lib/actions/getVariantsBySku.js')
const getVariantsBySkuRequest = require('./fixtures/getVariantsBySku/skus.json')
const getVariantsBySkuResponse = require('./fixtures/getVariantsBySku/response.json')
const result = require('./fixtures/getVariantsBySku/result.json')
const result2 = require('./fixtures/getVariantsBySku/result2.json')
// disable requests to the outside world
const nock = require('nock')
nock.disableNetConnect()
// silence console logs
console.log = () => {};
// nock.recorder.rec();

describe('Fulfills a sub order', () => {
  beforeEach(() => {
    this.message = {
      body: {
        currentMessage: getVariantsBySkuRequest
      }
    }

    this.config = {
      host: 'https://vendors-staging.herokuapp.com',
      apiKey: '049eb2f6c3976b75ea27f3f44cd16da17fe0586daeb97ff68471836641f929f7'
    }
  })

  describe('Valid request', () => {
    beforeEach((done) => {
      this.getVariantsRequest = nock('https://vendors-staging.herokuapp.com:443',
                                          {'encodedQueryParams': true})
                                      .get('/api/v1/variants?filter[sku]=1517001,ACP001,ALB001,ARMRD,BFD70,BFD90,CHI005-RH,CL9Q,CS030&fields[variants]=sku,inventory-quantity')

      this.self = {
        emit (action) { if (action == 'end') done() }
      }

      spyOn(this.self, 'emit').and.callThrough()

      this.getVariantsRequest = this.getVariantsRequest.reply(200, getVariantsBySkuResponse)

      getVariantsBySku.process.call(this.self, this.message, this.config)
    })

    it('emits valid JSON API compliant data', () => {
      expect(this.self.emit).toHaveBeenCalledTimes(8)
      expect(this.self.emit.calls.argsFor(0)[1].body).toEqual(result)
      expect(this.self.emit.calls.argsFor(3)[1].body).toEqual(result2)
      expect(this.self.emit).toHaveBeenCalledWith('end')
    })
  })

  describe('Invalid request', () => {
    beforeEach((done) => {
      this.self = {
        emit () { done() }
      }

      this.getVariantsRequest = nock('https://vendors-staging.herokuapp.com:443',
                                          {'encodedQueryParams': true})
                                      .post('/api/v1/fulfilments')

      this.message = {
        body: { currentMessage: { data: 'this is invalid data and will raise a rebound'}}
      }

      spyOn(this.self, 'emit').and.callThrough()

      this.getVariantsRequest = this.getVariantsRequest.reply(404)

      getVariantsBySku.process.call(this.self, this.message, this.config)
    })

    it('emits a rebound', () => {
      expect(this.self.emit).toHaveBeenCalledTimes(1)
      let emittedVerb = this.self.emit.calls.argsFor(0)[0]
      expect(emittedVerb).toEqual('error')
    })
  })
})
