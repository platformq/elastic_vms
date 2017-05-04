"use strict";

const updateDispatchDate = require('../lib/actions/updateDispatchDate.js').process;
const nock = require('nock');

nock.disableNetConnect();

console.log = () => {};

// fixtures
const input = require('./fixtures/updateDispatchDate/palletInput.json');
const nonPalletInput = require('./fixtures/updateDispatchDate/nonPalletInput.json');

describe("Updating a pallet order", () => {
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
        .patch('/api/v1/orders/123', {
          "data": {
            "id": "123",
            "type": "orders",
            "attributes": {
              "dispatch-date": "2016-11-05T00:00:00+00:00"
            }
          }
        });

      this.updateOrderRequest = this.updateOrderRequest.reply(200, {});

      updateDispatchDate.call(this.self, this.msg, this.cfg);
    });

    it("Sends a request to the VMS", () => {
      expect(this.updateOrderRequest.isDone()).toEqual(true);
    });

    it("Emits the original message", () => {
      let action = this.self.emit.calls.argsFor(0)[0];
      let payload = this.self.emit.calls.argsFor(0)[1].body;
      expect(action).toEqual('data');
      expect(payload).toEqual(this.msg.body);
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

      updateDispatchDate.call(this.self, this.msg, this.cfg);
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

describe("When given a non-pallet order", () => {
  beforeEach(() => {
    this.msg = {
      body: nonPalletInput
    }

    this.cfg = {
      host:   "https://vendors-staging.herokuapp.com",
      apiKey: "abc123"
    }
  });

  describe("Does not update dispatch date", () => {
    beforeEach((done) => {
      this.self = {
        emit(action) { if (action == 'end') done(); }
      };
      spyOn(this.self, 'emit').and.callThrough();

      this.updateOrderRequest = nock('https://vendors-staging.herokuapp.com')
        .patch('/api/v1/orders/123').reply(500);

      updateDispatchDate.call(this.self, this.msg, this.cfg);
    });

      it("Emits data", () => {
        let action = this.self.emit.calls.argsFor(0)[0];
        expect(action).toEqual('data');
      });

      it("Emits end", () => {
        expect(this.self.emit).toHaveBeenCalledTimes(2);
        expect(this.self.emit).toHaveBeenCalledWith('end');
      });
    });
});
