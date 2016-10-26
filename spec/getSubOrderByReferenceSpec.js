"use strict";

const getSubOrderByReference = require('../lib/actions/getSubOrderByReference.js');
const getSubOrderByReferenceResponse = require('./fixtures/getSubOrderByReferenceResponse.js');
const elasticio = require('elasticio-node');
const messages = elasticio.messages;
// disable requests to the outside world
const nock = require("nock");
// nock.recorder.rec();
nock.disableNetConnect();
// silence console logs
console.log = () => {};

describe("Retrieve a sub order", () => {

  beforeEach(() => {
    this.message = {
      body: { currentMessage: "MD1449STAGING" }
    }

    this.config = {
      host:   "https://vendors-staging.herokuapp.com",
      apiKey: "1e49232a8044fed348f44aeed1c288c085cc3fa6c550e9626ff61dfef2660ddf"
    }
  });

  describe("Valid request", () => {
    beforeEach((done) => {
      this.getSubOrderByReferenceRequest = nock('https://vendors-staging.herokuapp.com:443', 
                                          {"encodedQueryParams":true})
                                      .get('/api/v1/sub-orders')
                                      .query({filter: { reference: "MD1449STAGING" }});

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
      expect(passedMessageBody).toEqual({ currentMessage: JSON.stringify(getSubOrderByReferenceResponse), 
                                          vms: { 
                                            getSubOrderByReference: { 
                                              vmsSubOrder: JSON.stringify(getSubOrderByReferenceResponse) 
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
          vmsSubOrderReference: "this is invalid data and will raise an error"
        }
      }

      spyOn(this.self, "emit").and.callThrough();

      this.getSubOrderByReferenceRequest = this.getSubOrderByReferenceRequest.reply(404);

      getSubOrderByReference.process.call(this.self, this.message, this.config);
    });

    it("emits an error", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(1);
      let emittedVerb = this.self.emit.calls.argsFor(0)[0];
      expect(emittedVerb).toEqual('error');
    });
  });
});