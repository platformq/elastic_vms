const request     = require('request');

let baseUrl = "https://vendors-staging.herokuapp.com/api/v1/sub-orders";
let options = {
  headers: {
    'Content-Type': "application/vnd.api+json",
    'Accept': "application/vnd.api+json",
    'X-Auth-Token': "1e49232a8044fed348f44aeed1c288c085cc3fa6c550e9626ff61dfef2660ddf"
  }
};


function getSubOrderRecordByReference(msg, config) {
  let orderReference = msg.body.

  options.url = `${baseUrl}?filter[reference]=${orderReference}`
  request.get(options, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      let record = JSON.parse(body).data[0];
      let id = parseInt(record.id);
    }
  });
}

