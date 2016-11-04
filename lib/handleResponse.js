"use strict";

module.exports = handleResponse;

function handleResponse(responses) {
  if (!Array.isArray(responses)) {
    responses = [responses];
  }

  let results = responses.map(response => {
    console.log(response);
    console.log('Handling response from VMS');
    console.log('Status Code:', response.statusCode);
    console.log('Headers:', response.headers);
    console.log('Body:', response.body);
    // if we got a happy response
    if (response.statusCode >= 200 && response.statusCode < 400) {
      return "Resolved";
    } else {
      return "Rejected";
    }
  });

  if (results.every((e) => { return e == "Resolved" })) {
    return Promise.resolve(responses[0]);
  } else {
    let index = results.findIndex((e) => { return e == "Rejected" })
    return Promise.reject(responses[index]);
  }
}