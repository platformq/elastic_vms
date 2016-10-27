"use strict";

const getVendorsByReference = require('../lib/actions/getVendorsByReference.js');
const orderWebhook = require('./fixtures/orderWebhook.json');
const getVendorsByReferenceResponse = require('./fixtures/getVendorsResponse.json');
const filterLeadTimes  = require('../lib/getVendorsByReference/filterLeadTimes.js');
// disable requests to the outside world
const nock = require("nock");
// nock.recorder.rec();
nock.disableNetConnect();
// silence console logs
console.log = () => {};

describe("Retrieve vendors lead times", () => {

  beforeEach(() => {
    this.message = {
      body: orderWebhook
    }

    this.config = {
      host:   "https://vendors-staging.herokuapp.com",
      apiKey: "abc123"
    }
  });

  describe("Valid request", () => {
    beforeEach((done) => {
      this.getVendorsByReferenceRequest = nock('https://vendors-staging.herokuapp.com:443', 
                                          {"encodedQueryParams":true})
                                      .get('/api/v1/admin/vendors?filter[references]=Ultra');

      this.self = {
        emit() { done(); }
      };

      spyOn(this.self, "emit").and.callThrough();

      this.getVendorsByReferenceRequest = this.getVendorsByReferenceRequest.reply(200, getVendorsByReferenceResponse);

      getVendorsByReference.process.call(this.self, this.message, this.config);
    });

    it("sends a correct request to a correct VMS endpoint", () => {
      expect(this.getVendorsByReferenceRequest.isDone()).toBe(true);
    });

    it("emits valid JSON API compliant data", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(1);
      let passedMessageVerb = this.self.emit.calls.argsFor(0)[0];
      let passedMessageBody = this.self.emit.calls.argsFor(0)[1].body;
      let leadTimes = filterLeadTimes.filterLeadTimes(getVendorsByReferenceResponse);

      expect(passedMessageVerb).toEqual('data');
      expect(passedMessageBody).toEqual({ "webhook": orderWebhook.webhook, 
                                          "currentMessage": leadTimes,
                                          "vms": {
                                            "getVendorsByReference": {
                                              "leadTimes": leadTimes
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

      this.getVendorsByReferenceRequest = nock('https://vendors-staging.herokuapp.com:443', 
                                          {"encodedQueryParams":true})
                                      .get('/api/v1/admin/vendors?filter[references]=undefined')

      this.message = {
        body: { 
          webhook: {
            included: ["this is invalid data and will raise a rebound"]
          }
        }
      }

      spyOn(this.self, "emit").and.callThrough();

      this.getVendorsByReferenceRequest = this.getVendorsByReferenceRequest.reply(404);

      getVendorsByReference.process.call(this.self, this.message, this.config);
    });

    it("emits a rebound", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(1);
      let emittedVerb = this.self.emit.calls.argsFor(0)[0];
      expect(emittedVerb).toEqual('rebound');
    });
  });
});