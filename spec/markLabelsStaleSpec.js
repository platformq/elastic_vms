/* eslint-env jasmine */
'use strict'

const markLabelsStale = require('../lib/actions/markLabelsStale.js').process
const nock = require('nock')

nock.disableNetConnect()

// console.log = () => {}

// fixtures
const input = require('./fixtures/markLabelsStale/input.json')

describe('Updating an order', () => {
  beforeEach(() => {
    this.msg = {
      body: input
    }

    this.cfg = {
      host: 'https://vendors-staging.herokuapp.com',
      apiKey: 'abc123'
    }
  })

  describe('Successful update', () => {
    beforeEach((done) => {
      this.self = {
        emit (action) { if (action === 'end') done() }
      }
      spyOn(this.self, 'emit').and.callThrough()

      let subOrderIds = ['99', '100']
      this.updateSubOrderRequests = subOrderIds.map(subOrderId => {
        return nock('https://vendors-staging.herokuapp.com')
          .patch(`/api/v1/sub-orders/${subOrderId}`,
          {'data': {
            'id': subOrderId,
            'type': 'sub-orders',
            'attributes': {
              'needs-reprinting': true
            }
          }
          })
          .reply(200, {})
      })

      markLabelsStale.call(this.self, this.msg, this.cfg)
    })

    it('Sends correct requests to the VMS', () => {
      this.updateSubOrderRequests.forEach(updateSubOrderRequest => {
        expect(updateSubOrderRequest.isDone()).toEqual(true)
      })
    })

    it('Emits the original data', () => {
      let action = this.self.emit.calls.argsFor(0)[0]
      let payload = this.self.emit.calls.argsFor(0)[1].body
      expect(action).toEqual('data')
      expect(payload).toEqual(this.msg.body)
    })

    it('Emits end', () => {
      expect(this.self.emit).toHaveBeenCalledTimes(2)
      expect(this.self.emit).toHaveBeenCalledWith('end')
    })
  })

  describe('Failed update', () => {
    beforeEach((done) => {
      this.self = {
        emit (action) { if (action === 'end') done() }
      }
      spyOn(this.self, 'emit').and.callThrough()

      let subOrderIds = ['99', '100']
      this.updateSubOrderRequests = subOrderIds.map(subOrderId => {
        return nock('https://vendors-staging.herokuapp.com')
          .patch(`/api/v1/sub-orders/${subOrderId}`)
          .reply(429)
      })

      markLabelsStale.call(this.self, this.msg, this.cfg)
    })

    it('Emits rebound', () => {
      let action = this.self.emit.calls.argsFor(0)[0]
      expect(action).toEqual('rebound')
    })

    it('Emits end', () => {
      expect(this.self.emit).toHaveBeenCalledTimes(2)
      expect(this.self.emit).toHaveBeenCalledWith('end')
    })
  })
})

