"use strict";

module.exports = {
  filterLeadTimes: (response) => {
    console.log('Filtering Lead Times');
    let body = response.body;
    let data = {};

    body.data.forEach((vendor) => {
      data[vendor.attributes.name] = vendor.attributes.leadtime
    })

    return data;
  },

  returnLeadTimes: (response) => {
    return Promise.resolve(filterLeadTimes(response));
  }
}