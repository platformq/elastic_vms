"use strict";

const updateVariantInventory = require('../lib/actions/updateVariantInventory.js');
const message  = require('./fixtures/updateVariantInventory/request.json');
// disable requests to the outside world
const nock = require("nock");
nock.disableNetConnect();
// silence console logs
console.log = () => {};

describe("Acknowledge a sub order", () => {

  beforeEach(() => {
    this.message = {
      body: message
    }

    this.config = {
      host:   "https://vendors-staging.herokuapp.com",
      apiKey: "abc123"
    }
  });

  describe("Valid request", () => {
    beforeEach((done) => {
      this.updateVariantInventoryRequest = nock('https://vendors-staging.herokuapp.com:443', 
                                          {"encodedQueryParams":true})
                                      .patch('/api/v1/variants/6033', {
                                         "data": {
                                            "attributes": {
                                              "inventory-quantity": 1022
                                            },
                                            "type": "variants",
                                            "id": 6033 
                                          }
                                      });

      this.self = {
        emit() { done(); }
      };

      spyOn(this.self, "emit").and.callThrough();

      this.updateVariantInventoryRequest = this.updateVariantInventoryRequest.reply(200, message);

      updateVariantInventory.process.call(this.self, this.message, this.config);
    });

    it("sends a correct request to a correct VMS endpoint", () => {
      expect(this.updateVariantInventoryRequest.isDone()).toBe(true);
    });

    it("emits valid JSON API compliant data", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(1);
      let passedMessageVerb = this.self.emit.calls.argsFor(0)[0];
      let passedMessageBody = this.self.emit.calls.argsFor(0)[1].body;
      expect(passedMessageVerb).toEqual('data');
      expect(passedMessageBody).toEqual(message);
    });
  });

  describe("Invalid request", () => {
    beforeEach((done) => {
      this.self = {
        emit() { done(); }
      };

      this.updateVariantInventoryRequest = nock('https://vendors-staging.herokuapp.com:443', 
                                          {"encodedQueryParams":true})
                                      .patch('/api/v1/variants/undefined');

      this.message = {
        body: {
          "data": "this is invalid data and will raise a rebound"
        }
      }

      spyOn(this.self, "emit").and.callThrough();

      this.updateVariantInventoryRequest = this.updateVariantInventoryRequest.reply(404);

      updateVariantInventory.process.call(this.self, this.message, this.config);
    });

    it("emits a rebound", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(1);
      let emittedVerb = this.self.emit.calls.argsFor(0)[0];
      expect(emittedVerb).toEqual('error');
    });
  });
});