module.exports = {
  "data": [
    {
      "id": "610",
      "type": "sub-orders",
      "links": {
        "self": "https://vendors-staging.herokuapp.com/api/v1/sub-orders/610"
      },
      "attributes": {
        "order-id": 446,
        "created-at": "2016-09-08T12:51:43.415+01:00",
        "updated-at": "2016-10-03T16:47:00.789+01:00",
        "acknowledged-at": "2016-10-03T16:47:00.781+01:00",
        "line-items-count": 2,
        "fulfilled-at": null,
        "acknowledged?": true,
        "fulfilled?": false,
        "partially-fulfilled?": false,
        "reference": "MD1449STAGING"
      },
      "relationships": {
        "line-items": {
          "links": {
            "self": "https://vendors-staging.herokuapp.com/api/v1/sub-orders/610/relationships/line-items",
            "related": "https://vendors-staging.herokuapp.com/api/v1/sub-orders/610/line-items"
          }
        },
        "fulfilments": {
          "links": {
            "self": "https://vendors-staging.herokuapp.com/api/v1/sub-orders/610/relationships/fulfilments",
            "related": "https://vendors-staging.herokuapp.com/api/v1/sub-orders/610/fulfilments"
          }
        }
      }
    }
  ],
  "links": {
    "first": "https://vendors-staging.herokuapp.com/api/v1/sub-orders?filter%5Breference%5D=MD1449STAGING&page%5Blimit%5D=20&page%5Boffset%5D=0",
    "last": "https://vendors-staging.herokuapp.com/api/v1/sub-orders?filter%5Breference%5D=MD1449STAGING&page%5Blimit%5D=20&page%5Boffset%5D=0"
  }
}