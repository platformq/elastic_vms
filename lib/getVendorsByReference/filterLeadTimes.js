"use strict";

module.exports = filterLeadTimes;

function filterLeadTimes(body) {
  console.log('Filtering Lead Times');
  let data = {};

  body.data.forEach((vendor) => {
    data[vendor.attributes.name] = vendor.attributes.leadtime
  })

  console.log(data);

  return Promise.resolve(data);
}