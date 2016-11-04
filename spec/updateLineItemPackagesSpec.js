"use strict";

const updateLineItemPackages = require('../lib/actions/updateLineItemPackages.js');
const updateLineItemPackagesResponse = require('./fixtures/updateLineItemPackagesResponse.json');
const orderWebhook = require('./fixtures/orderWebhook.json');
// disable requests to the outside world
const nock = require("nock");
nock.disableNetConnect();
// nock.recorder.rec();
// silence console logs
// console.log = () => {};

describe("Updates number of packages on a line item", () => {

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
      this.updateLineItemPackagesRequest1 = nock('https://vendors-staging.herokuapp.com:443', {"encodedQueryParams":true})
                                            .patch('/api/v1/line-items/1', {"data":{"type":"line-items","id":1,"attributes":{ "packages": 1 }}})

      this.updateLineItemPackagesRequest2 = nock('https://vendors-staging.herokuapp.com:443', {"encodedQueryParams":true})
                                            .patch('/api/v1/line-items/3', {"data":{"type":"line-items","id":3,"attributes":{ "packages": 5 }}})

      this.updateLineItemPackagesRequest3 = nock('https://vendors-staging.herokuapp.com:443', {"encodedQueryParams":true})
                                            .patch('/api/v1/line-items/2', {"data":{"type":"line-items","id":2,"attributes":{ "packages": 3 }}})


      this.self = {
        emit() { done(); }
      };

      spyOn(this.self, "emit").and.callThrough();

      this.updateLineItemPackagesRequest1 = this.updateLineItemPackagesRequest1.reply(200, updateLineItemPackagesResponse);
      this.updateLineItemPackagesRequest2 = this.updateLineItemPackagesRequest2.reply(200, updateLineItemPackagesResponse);
      this.updateLineItemPackagesRequest3 = this.updateLineItemPackagesRequest3.reply(200, updateLineItemPackagesResponse);

      updateLineItemPackages.process.call(this.self, this.message, this.config);
    });

    it("sends a correct request to a correct VMS endpoint", () => {
      expect(this.updateLineItemPackagesRequest1.isDone()).toBe(true);
    });

    it("emits valid JSON API compliant data", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(1);
      let passedMessageVerb = this.self.emit.calls.argsFor(0)[0];
      let passedMessageBody = this.self.emit.calls.argsFor(0)[1].body;
      expect(passedMessageVerb).toEqual('data');
      expect(passedMessageBody).toEqual(orderWebhook);
    });
  });

  describe("Invalid request", () => {
    beforeEach((done) => {
      this.self = {
        emit() { done(); }
      };

      this.updateLineItemPackagesRequest = nock('https://vendors-staging.herokuapp.com:443', 
                                          {"encodedQueryParams":true})
                                      .patch('/api/v1/sub-orders/undefined');

      this.message = {
        body: {
          webhook: { included: ["this is invalid data and will raise a rebound"] }
        }
      }

      spyOn(this.self, "emit").and.callThrough();

      this.updateLineItemPackagesRequest = this.updateLineItemPackagesRequest.reply(404);

      updateLineItemPackages.process.call(this.self, this.message, this.config);
    });

    it("emits a rebound", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(1);
      let emittedVerb = this.self.emit.calls.argsFor(0)[0];
      expect(emittedVerb).toEqual('rebound');
    });
  });
});