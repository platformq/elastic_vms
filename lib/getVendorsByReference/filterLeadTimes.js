"use strict";

module.exports = filterLeadTimes;

function filterLeadTimes(body) {
  console.log('Filtering Lead Times');
  let data = {};

  body.data.forEach((vendor) => {
    data[vendor.name] = vendor.leadtime
  })

  return Promise.resolve(data);
}