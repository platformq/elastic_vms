"use strict";

const getVendorsByReference = require('../lib/actions/getVendorsByReference.js');
const orderWebhook = require('./fixtures/orderWebhook.json');
const getVendorsByReferenceResponse = require('./fixtures/getVendorsResponse.json');
const elasticio = require('elasticio-node');
const filterLeadTimes  = require('../lib/getVendorsByReference/filterLeadTimes.js');
const messages = elasticio.messages;
// disable requests to the outside world
const nock = require("nock");
// nock.recorder.rec();
nock.disableNetConnect();
// silence console logs
// console.log = () => {};

describe("Retrieve vendors lead times", () => {

  beforeEach(() => {
    this.message = {
      body: orderWebhook
    }

    this.config = {
      host:   "https://vendors-staging.herokuapp.com",
      apiKey: "c91966a95dfdf3f6a446dedc189f49c75827e20f84b30c24d22749810695d86c"
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

    // it("sends a correct request to a correct VMS endpoint", () => {
    //   expect(this.getVendorsByReferenceRequest.isDone()).toBe(true);
    // });

    it("emits valid JSON API compliant data", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(1);
      let passedMessageVerb = this.self.emit.calls.argsFor(0)[0];
      let passedMessageBody = this.self.emit.calls.argsFor(0)[1].body;
      expect(passedMessageVerb).toEqual('data');
      expect(passedMessageBody).toEqual({ "currentMessage": filterLeadTimes(getVendorsByReferenceResponse),
                                          "vms": {
                                            "leadTimes": filterLeadTimes(getVendorsByReferenceResponse)
                                          }
                                        });
    });
  });

  // describe("Invalid request", () => {
  //   beforeEach((done) => {
  //     this.self = {
  //       emit() { done(); }
  //     };

  //     this.getVendorsByReferenceRequest = nock('https://vendors-staging.herokuapp.com:443', 
  //                                         {"encodedQueryParams":true})
  //                                     .get('/api/v1/admin/vendors')
  //                                     .query({filter: { references: ["undefined"] }});

  //     this.message = {
  //       body: "this is invalid data and will raise an error"
  //     }

  //     spyOn(this.self, "emit").and.callThrough();

  //     this.getVendorsByReferenceRequest = this.getVendorsByReferenceRequest.reply(404);

  //     getVendorsByReference.process.call(this.self, this.message, this.config);
  //   });

  //   it("emits an error", () => {
  //     expect(this.self.emit).toHaveBeenCalledTimes(1);
  //     let emittedVerb = this.self.emit.calls.argsFor(0)[0];
  //     expect(emittedVerb).toEqual('error');
  //   });
  // });
});