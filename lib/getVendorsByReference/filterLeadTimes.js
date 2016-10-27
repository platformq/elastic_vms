"use strict";

module.exports = {
  filterLeadTimes: (body) => {
    console.log('Filtering Lead Times');
    let data = {};

    body.data.forEach((vendor) => {
      data[vendor.attributes.name] = vendor.attributes.leadtime
    })

    return data;
  },

  returnLeadTimes: (body) => {
    return Promise.resolve(filterLeadTimes(body));
  }
}