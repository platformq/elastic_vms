"use strict";
const request = require('request');

exports.process = (message, config) => {
  let orderReference = message.body;

  config.url = `${config.url}sub-orders?filter[reference]=${orderReference}`
  request.get(config, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      let record = JSON.parse(body).data[0];
      let id = parseInt(record.id);
    }
  });
}

