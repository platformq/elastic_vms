"use strict";

const updateOrderStatus = require('../lib/actions/updateOrderStatus.js').process;
const nock = require('nock');

nock.disableNetConnect();

// console.log = () => {};

// fixtures
const input = require('./fixtures/updateOrderStatus/input.json');
const filterOrdersResponse = require('./fixtures/updateOrderStatus/filterOrdersResponse.json');
const filterOrdersEmptyResponse = require('./fixtures/updateOrderStatus/filterOrdersEmptyResponse.json');
const updateOrderRequest = require('./fixtures/updateOrderStatus/updateOrderRequest.json');
const updateOrderResponse = require('./fixtures/updateOrderStatus/updateOrderResponse.json');

describe("Updating order status", () => {
  beforeEach(() => {
    this.cfg = {
      host:   "https://vendors-staging.herokuapp.com",
      apiKey: "abc123"
    };
  });

  describe("Successful update", () => {
    beforeEach((done) => {
      this.self = {
        emit(action) { if (action == 'end') done(); }
      };
      spyOn(this.self, "emit").and.callThrough();

      this.msg = {
        body: input
      };

      this.filterOrdersRequest = nock('https://vendors-staging.herokuapp.com', {"encodedQueryParams":true})
          .get('/api/v1/orders?filter[consignment_reference]=EC-000-00A-K9G')
          .reply(200, filterOrdersResponse);

      this.updateOrderRequest = nock('https://vendors-staging.herokuapp.com', {"encodedQueryParams":true})
          .patch('/api/v1/orders/123', updateOrderRequest)
          .reply(200, updateOrderResponse);

      updateOrderStatus.call(this.self, this.msg, this.cfg);
    });

    it("Fetches orders by consignment reference", () => {
      expect(this.filterOrdersRequest.isDone()).toEqual(true);
    });

    it("Update the order status", () => {
      expect(this.updateOrderRequest.isDone()).toEqual(true);
    });

    it("Emits data", () => {
      expect(this.self.emit.calls.argsFor(0)[0]).toEqual('data');
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
      spyOn(this.self, "emit").and.callThrough();

      this.msg = {
        body: input
      };

      this.filterOrdersRequest = nock('https://vendors-staging.herokuapp.com', {"encodedQueryParams":true})
          .get('/api/v1/orders?filter[consignment_reference]=EC-000-00A-K9G')
          .reply(200, filterOrdersResponse);

      this.updateOrderRequest = nock('https://vendors-staging.herokuapp.com', {"encodedQueryParams":true})
          .patch('/api/v1/orders/123', updateOrderRequest)
          .reply(500);

      updateOrderStatus.call(this.self, this.msg, this.cfg);
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

  describe("When the order does not exist", () => {
    beforeEach((done) => {
      this.self = {
        emit(action) { if (action == 'end') done(); }
      };
      spyOn(this.self, "emit").and.callThrough();

      this.msg = {
        body: input
      };

      this.filterOrdersRequest = nock('https://vendors-staging.herokuapp.com', {"encodedQueryParams":true})
          .get('/api/v1/orders?filter[consignment_reference]=EC-000-00A-K9G')
          .reply(200, filterOrdersEmptyResponse);

      updateOrderStatus.call(this.self, this.msg, this.cfg);
    });

    it("Fetches orders by consignment reference", () => {
      expect(this.filterOrdersRequest.isDone()).toEqual(true);
    });

    it("Emits data", () => {
      expect(this.self.emit.calls.argsFor(0)[0]).toEqual('data');
    });
    
    it("Emits end", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(2);
      expect(this.self.emit).toHaveBeenCalledWith('end');
    });
  })
});
