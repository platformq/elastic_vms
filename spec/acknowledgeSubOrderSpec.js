"use strict";

const acknowledgeSubOrder = require('../lib/actions/acknowledgeSubOrder.js');
const acknowledgeSubOrderResponse = require('./fixtures/acknowledgeSubOrderResponse.json');
const acknowledgeSubOrderRequest  = require('./fixtures/getOrderReferenceResponse.json');
// disable requests to the outside world
const nock = require("nock");
nock.disableNetConnect();
// silence console logs
console.log = () => {};

describe("Acknowledge a sub order", () => {

  beforeEach(() => {
    this.message = {
      body: {
        currentMessage: acknowledgeSubOrderRequest
      }
    }

    this.config = {
      host:   "https://vendors-staging.herokuapp.com",
      apiKey: "abc123"
    }
  });

  describe("Valid request", () => {
    beforeEach((done) => {
      this.acknowledgeSubOrderRequest = nock('https://vendors-staging.herokuapp.com:443', 
                                          {"encodedQueryParams":true})
                                      .patch('/api/v1/sub-orders/6', {
                                         "data": {
                                            "attributes": {
                                              "acknowledge": true
                                            },
                                            "type": "sub-orders",
                                            "id": 6
                                          }
                                      });

      this.self = {
        emit() { done(); }
      };

      spyOn(this.self, "emit").and.callThrough();

      this.acknowledgeSubOrderRequest = this.acknowledgeSubOrderRequest.reply(200, acknowledgeSubOrderResponse);

      acknowledgeSubOrder.process.call(this.self, this.message, this.config);
    });

    it("sends a correct request to a correct VMS endpoint", () => {
      expect(this.acknowledgeSubOrderRequest.isDone()).toBe(true);
    });

    it("emits valid JSON API compliant data", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(1);
      let passedMessageVerb = this.self.emit.calls.argsFor(0)[0];
      let passedMessageBody = this.self.emit.calls.argsFor(0)[1].body;
      expect(passedMessageVerb).toEqual('data');
      expect(passedMessageBody).toEqual({ currentMessage: acknowledgeSubOrderResponse,
                                          vms: {
                                            acknowledgeSubOrder: {
                                              vmsSubOrderAcknowledgement: acknowledgeSubOrderResponse
                                            }
                                          }
                                        });
    });
  });

  describe("Invalid request", () => {
    beforeEach((done) => {
      this.self = {
        emit() { done(); }
      };

      this.acknowledgeSubOrderRequest = nock('https://vendors-staging.herokuapp.com:443', 
                                          {"encodedQueryParams":true})
                                      .patch('/api/v1/sub-orders/undefined');

      this.message = {
        body: {
          "data": "this is invalid data and will raise a rebound"
        }
      }

      spyOn(this.self, "emit").and.callThrough();

      this.acknowledgeSubOrderRequest = this.acknowledgeSubOrderRequest.reply(404);

      acknowledgeSubOrder.process.call(this.self, this.message, this.config);
    });

    it("emits a rebound", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(1);
      let emittedVerb = this.self.emit.calls.argsFor(0)[0];
      expect(emittedVerb).toEqual('rebound');
    });
  });
});