"use strict";

const updateOrderStatus = require('../lib/actions/updateOrderStatus.js').process;
const nock = require('nock');

nock.disableNetConnect();

console.log = () => {};

// fixtures
const input = require('./fixtures/updateOrderStatus/input.json');
const filterOrdersResponse = require('./fixtures/updateOrderStatus/filterOrdersResponse.json');
const filterOrdersEmptyResponse = require('./fixtures/updateOrderStatus/filterOrdersEmptyResponse.json');
const filterReturnsResponse = require('./fixtures/updateOrderStatus/filterReturnsResponse.json');
const updateOrderRequest = require('./fixtures/updateOrderStatus/updateOrderRequest.json');
const updateReturnRequest = require('./fixtures/updateOrderStatus/updateReturnRequest.json');
const updateOrderResponse = require('./fixtures/updateOrderStatus/updateOrderResponse.json');
const updateReturnResponse = require('./fixtures/updateOrderStatus/updateReturnResponse.json');

describe("Updating order and return statuses", () => {
  beforeEach(() => {
    this.cfg = {
      host:   "https://vendors-staging.herokuapp.com",
      apiKey: "abc123"
    };
  });

  describe("Successful order update", () => {
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

      this.filterReturnsRequest = nock('https://vendors-staging.herokuapp.com', {"encodedQueryParams":true})
          .get('/api/v1/admin/returns?filter[dms_reference]=EC-000-00A-K9G')
          .reply(200, {data: []});

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

    it("Emits order data", () => {
      let action = this.self.emit.calls.argsFor(0)[0]
      let payload = this.self.emit.calls.argsFor(0)[1]
      expect(action).toEqual('data')
      expect(payload.body.vms.updateOrderStatus.data.id).toEqual('123')
    })

    it("Emits end", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(2);
      expect(this.self.emit).toHaveBeenCalledWith('end');
    });
  });

  describe("Successful return update", () => {
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
          .reply(200, {data: []});

      this.filterReturnsRequest = nock('https://vendors-staging.herokuapp.com', {"encodedQueryParams":true})
          .get('/api/v1/admin/returns?filter[dms_reference]=EC-000-00A-K9G')
          .reply(200, filterReturnsResponse);

      this.updateOrderRequest = nock('https://vendors-staging.herokuapp.com', {"encodedQueryParams":true})
          .patch('/api/v1/admin/returns/51', updateReturnRequest)
          .reply(200, updateReturnResponse);

      updateOrderStatus.call(this.self, this.msg, this.cfg);
    });

    it("Fetches orders by consignment reference", () => {
      expect(this.filterOrdersRequest.isDone()).toEqual(true);
    });

    it("Update the order status", () => {
      expect(this.updateOrderRequest.isDone()).toEqual(true);
    });

    it("Emits empty data", () => {
      let action = this.self.emit.calls.argsFor(0)[0]
      let payload = this.self.emit.calls.argsFor(0)[1]
      expect(action).toEqual('data')
      expect(payload.body.vms.updateOrderStatus).toEqual({})
    })

    it("Emits end", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(2);
      expect(this.self.emit).toHaveBeenCalledWith('end');
    });
  });

  describe("Failed order update", () => {
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

      this.filterReturnsRequest = nock('https://vendors-staging.herokuapp.com', {"encodedQueryParams":true})
          .get('/api/v1/admin/returns?filter[dms_reference]=EC-000-00A-K9G')
          .reply(200, {data: []});

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

  describe("When order and return do not exist", () => {
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

      this.filterReturnsRequest = nock('https://vendors-staging.herokuapp.com', {"encodedQueryParams":true})
          .get('/api/v1/admin/returns?filter[dms_reference]=EC-000-00A-K9G')
          .reply(200, {data: []});

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
