"use strict";

const updateConsignmentReference = require('../lib/actions/updateConsignmentReference.js').process;
const nock = require('nock');

nock.disableNetConnect();

console.log = () => {};

// fixtures
const input = require('./fixtures/updateConsignmentReference/input.json');

describe("Updating an order", () => {
  beforeEach(() => {
    this.msg = {
      body: input
    }

    this.cfg = {
      host:   "https://vendors-staging.herokuapp.com",
      apiKey: "abc123"
    }
  });

  describe("Successful update", () => {
    beforeEach((done) => {
      this.self = {
        emit(action) { if (action == 'end') done(); }
      };
      spyOn(this.self, 'emit').and.callThrough();

      this.updateOrderRequest = nock('https://vendors-staging.herokuapp.com')
        .patch('/api/v1/orders/123',
            {"data":{
              "id":"123",
              "type":"orders",
              "attributes":{
                "consignment-reference":"EC-000-04F-2AD",
              }
            }
          });

      this.updateOrderRequest = this.updateOrderRequest.reply(200, {});

      updateConsignmentReference.call(this.self, this.msg, this.cfg);
    });

    it("Sends a request to the VMS", () => {
      expect(this.updateOrderRequest.isDone()).toEqual(true);
    });

    it("Emits empty data", () => {
      let action = this.self.emit.calls.argsFor(0)[0];
      expect(action).toEqual('data');
    });

    it("Emits end", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(2);
      expect(this.self.emit).toHaveBeenCalledWith('end');
    });
  });

  describe("Failed update", () => {
    beforeEach((done) => {
      this.self = {
        emit(action) { if (action == 'end') done(); }
      };
      spyOn(this.self, 'emit').and.callThrough();

      this.updateOrderRequest = nock('https://vendors-staging.herokuapp.com')
        .patch('/api/v1/orders/123').reply(500);

      updateConsignmentReference.call(this.self, this.msg, this.cfg);
    });

    it("Emits rebound", () => {
      let action = this.self.emit.calls.argsFor(0)[0];
      expect(action).toEqual('rebound');
    });

    it("Emits end", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(2);
      expect(this.self.emit).toHaveBeenCalledWith('end');
    });
  });
});