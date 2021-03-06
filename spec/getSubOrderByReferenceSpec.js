"use strict";

const getSubOrderByReference = require('../lib/actions/getSubOrderByReference.js');
const getSubOrderByReferenceResponse = require('./fixtures/getOrderReferenceResponse.json');
// disable requests to the outside world
const nock = require("nock");
// nock.recorder.rec();
nock.disableNetConnect();
// silence console logs
console.log = () => {};

describe("Retrieve a sub order", () => {

  beforeEach(() => {
    this.message = {
      body: { currentMessage: { orderReference: "MD1039STAGING" } }
    }

    this.config = {
      host:   "https://vendors-staging.herokuapp.com",
      apiKey: "abc123"
    }
  });

  describe("Valid request", () => {
    beforeEach((done) => {
      this.getSubOrderByReferenceRequest = nock('https://vendors-staging.herokuapp.com:443', 
                                          {"encodedQueryParams":true})
                                      .get('/api/v1/sub-orders')
                                      .query({filter: { reference: "MD1039STAGING" }, include: 'line-items'});

      this.self = {
        emit() { done(); }
      };

      spyOn(this.self, "emit").and.callThrough();

      this.getSubOrderByReferenceRequest = this.getSubOrderByReferenceRequest.reply(200, getSubOrderByReferenceResponse);

      getSubOrderByReference.process.call(this.self, this.message, this.config);
    });

    it("sends a correct request to a correct VMS endpoint", () => {
      expect(this.getSubOrderByReferenceRequest.isDone()).toBe(true);
    });

    it("emits valid JSON API compliant data", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(1);
      let passedMessageVerb = this.self.emit.calls.argsFor(0)[0];
      let passedMessageBody = this.self.emit.calls.argsFor(0)[1].body;
      expect(passedMessageVerb).toEqual('data');
      expect(passedMessageBody).toEqual({ currentMessage: getSubOrderByReferenceResponse, 
                                          vms: { 
                                            getSubOrderByReference: { 
                                              vmsSubOrder: getSubOrderByReferenceResponse 
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

      this.getSubOrderByReferenceRequest = nock('https://vendors-staging.herokuapp.com:443', 
                                          {"encodedQueryParams":true})
                                      .get('/api/v1/sub-orders/filter[reference]=undefined')
                                      .query({filter: { reference: "undefined" }});

      this.message = {
        body: {
          vmsSubOrderReference: "this is invalid data and will raise a rebound"
        }
      }

      spyOn(this.self, "emit").and.callThrough();

      this.getSubOrderByReferenceRequest = this.getSubOrderByReferenceRequest.reply(404);

      getSubOrderByReference.process.call(this.self, this.message, this.config);
    });

    it("emits a rebound", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(1);
      let emittedVerb = this.self.emit.calls.argsFor(0)[0];
      expect(emittedVerb).toEqual('rebound');
    });
  });
});