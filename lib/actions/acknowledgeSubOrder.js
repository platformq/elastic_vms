const request     = require('request');

function acknowledgeSubOrder(id) {
  options.url = `${baseUrl}/${id}`;
  options.json = true;
  options.body = {  
    "data": {
      "attributes": {
        "acknowledge": true
      },
      "type": "sub-orders",
      "id": id
    } 
  };

  request.patch(options, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      console.log(body);
    }
  });
  sftp.end();
}