"use strict";

const createShippingConfirmation = require('../lib/actions/createShippingConfirmation.js').process;
const nock = require('nock');

nock.disableNetConnect();

// fixtures
const inputManifested = require('./fixtures/createShippingConfirmation/inputManifested.json');
const inputNotManifested = require('./fixtures/createShippingConfirmation/inputNotManifested.json');
const inputManifestedNoUpdateStatus = require('./fixtures/createShippingConfirmation/inputManifestedNoUpdateStatus.json');
const createShippingConfirmationRequest = require('./fixtures/createShippingConfirmation/createShippingConfirmationRequest.json');
const createShippingConfirmationResponse = require('./fixtures/createShippingConfirmation/createShippingConfirmationResponse.json');

describe("Creating a shipping confirmation", () => {

  beforeEach(() => {
    this.cfg = {
      host:   "https://vendors-staging.herokuapp.com",
      apiKey: "abc123"
    }
  });

  describe("When consignment status is Manifested", () => {
    describe("Successful request", () => {
      beforeEach(done => {
        this.self = {
          emit(action) { if (action === 'end') done(); }
        };
        spyOn(this.self, 'emit').and.callThrough();

        this.msg = {
          body: inputManifested
        };

        this.createShippingConfirmationRequest = nock('https://vendors-staging.herokuapp.com')
            .post('/api/v1/admin/shipping-confirmations', createShippingConfirmationRequest)
            .reply(201, createShippingConfirmationResponse);

        createShippingConfirmation.call(this.self, this.msg, this.cfg);
      });

      it("Sends data to the VMS", () => {
        expect(this.createShippingConfirmationRequest.isDone()).toEqual(true);
      });

      it("Emits data", () => {
        expect(this.self.emit.calls.argsFor(0)[0]).toEqual('data');
      });

      it("Emits end", () => {
        expect(this.self.emit).toHaveBeenCalledTimes(2);
        expect(this.self.emit).toHaveBeenCalledWith('end');
      });
    });

    describe("Failed request", () => {
      beforeEach(done => {
        this.self = {
          emit(action) { if (action === 'end') done(); }
        };
        spyOn(this.self, 'emit').and.callThrough();

        this.msg = {
          body: inputManifested
        };

        this.createShippingConfirmationRequest = nock('https://vendors-staging.herokuapp.com')
            .post('/api/v1/admin/shipping-confirmations', createShippingConfirmationRequest)
            .reply(429);

        createShippingConfirmation.call(this.self, this.msg, this.cfg);
      });

      it("Emits rebound", () => {
        expect(this.self.emit.calls.argsFor(0)[0]).toEqual('rebound');
      });

      it("Emits end", () => {
        expect(this.self.emit).toHaveBeenCalledTimes(2);
        expect(this.self.emit).toHaveBeenCalledWith('end');
      });
    });
  });

  describe("When consignment status is other than Manifested", () => {
    beforeEach(done => {
      this.self = {
        emit(action) { if (action === 'end') done(); }
      };
      spyOn(this.self, 'emit').and.callThrough();

      this.msg = {
        body: inputNotManifested
      };

      this.createShippingConfirmationRequest = nock('https://vendors-staging.herokuapp.com')
          .post('/api/v1/admin/shipping-confirmations')
          .reply(201, createShippingConfirmationResponse);

      createShippingConfirmation.call(this.self, this.msg, this.cfg);
    });

    it("Does not send data to the VMS", () => {
      expect(this.createShippingConfirmationRequest.isDone()).toEqual(false);
    });

    it("Emits data", () => {
      expect(this.self.emit.calls.argsFor(0)[0]).toEqual('data');
      expect(this.self.emit.calls.argsFor(0)[1].body.currentMessage).toEqual('Consignment status was InTransit, shipping confirmation was not created');
    });

    it("Emits end", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(2);
      expect(this.self.emit).toHaveBeenCalledWith('end');
    });
  });

  describe("When updateOrderStatus is empty", () => {
    beforeEach(done => {
      this.self = {
        emit(action) { if (action === 'end') done(); }
      };
      spyOn(this.self, 'emit').and.callThrough();

      this.msg = {
        body: inputManifestedNoUpdateStatus
      };

      createShippingConfirmation.call(this.self, this.msg, this.cfg);
    });

    it("Emits data", () => {
      expect(this.self.emit.calls.argsFor(0)[0]).toEqual('data');
      expect(this.self.emit.calls.argsFor(0)[1].body.currentMessage).toEqual({});
    });

    it("Emits end", () => {
      expect(this.self.emit).toHaveBeenCalledTimes(2);
      expect(this.self.emit).toHaveBeenCalledWith('end');
    });
  });
});
