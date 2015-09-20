 var express = require('express');
 var _ = require('lodash');
 var router = express.Router();
 var request = require('request');
 var moment = require('moment');


router.get('/yolo/:howlong/:from/:to', function(req, res, next) {
    var howlong = req.params.howlong;
    var now = moment();
    var later = moment().add(howlong, 'days');
    now = now.format("YYYYMMDD");
    later = later.format("YYYYMMDD");
    var whereFrom = req.params.from;
    var whereTo = req.params.to;
    
    //query for airport code
    function _toAirportCode(originLoc, _callback) {
        request('http://www.priceline.com/svcs/ac/index/flights/'+originLoc,function(error, response, body) {
            if(!error && response.statusCode == 200) {
                var airportsRaw = JSON.parse(body)["searchItems"];
                var airports = _.map(airportsRaw, function(airport) {
                    return {
                        'id': airport.id,
                        'name': airport.itemName,
                        'score': airport.score
                    };
                });
                // console.log(airports);
                // console.log(_.max(airports, 'score').id);
                if(typeof(_callback) == "function") {
                    _callback(_.max(airports, 'score').id);
                }
            }
        });
    }

    var fromAirportCode, toAirportCode;
    _toAirportCode(whereFrom, function(id) {
        fromAirportCode = id;
        _toAirportCode(whereTo, function(id) {
            toAirportCode = id;
            
            var finalDict = {};
            request('http://gogogogo.co/api/flights/'+fromAirportCode+'/'+toAirportCode+'/'+now+'/'+later, function(error, response, body) {
                if(!error && response.statusCode == 200) {
                    finalDict["flights"] = JSON.parse(body);
                    request('http://gogogogo.co/api/hotels/'+whereTo+'/'+now+'/'+later, function(error, response, body) {
                        if(!error && response.statusCode == 200) {
                            finalDict["hotels"] = JSON.parse(body);
                            request('http://gogogogo.co/api/places/'+whereTo+'/food', function(error, response, body) {
                                if(!error && response.statusCode == 200) {
                                    finalDict["places"] = JSON.parse(body);
                                    res.send(finalDict);
                                } else {
                                    return error;
                                }
                            });
                        } else {
                            return error;
                        }
                    });
                }
                else {
                    return error;
                }
            });
        });
    });
    
    
    // var flights = request('/api/flights/'+fromAirportCode+'/'+toAirportCode+'/'+now+'/'+later, function(error, response, body) {
    //  if(!error && response.statusCode == 200) {
    //      return body;
    //  }
    //  else {
    //      return error;
    //  }
    // });
    
});

module.exports = router;