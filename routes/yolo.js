 var express = require('express');
 var _ = require('lodash');
 var router = express.Router();
 var request = require('request');
 var moment = require('moment');
 
 process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


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
                        'city': airport.cityName,
                        'score': airport.score
                    };
                });
                // console.log(airports);
                // console.log(_.max(airports, 'score').id);
                if(typeof(_callback) == "function") {
                    _callback(_.max(airports, 'score'));
                }
            }
        });
    }

    var fromAirportCode, toAirportCode, fromCity, toCity;
    _toAirportCode(whereFrom, function(airport) {
        fromAirportCode = airport.id;
        fromCity = airport.city;
        _toAirportCode(whereTo, function(airport) {
            toAirportCode = airport.id;
            toCity = airport.city;
            
            var finalDict = {};
            finalDict['from'] = fromCity;
            finalDict['to'] = toCity;
            request('https://gogogogo.co/api/flights/'+fromAirportCode+'/'+toAirportCode+'/'+now+'/'+later+'/1', function(error, response, body) {
                if(!error && response.statusCode == 200) {
                    finalDict["flights"] = JSON.parse(body)[0];
                    request('https://gogogogo.co/api/hotels/'+whereTo+'/'+now+'/'+later, function(error, response, body) {
                        if(!error && response.statusCode == 200) {
                            finalDict["hotel"] = JSON.parse(body);
                            request('https://gogogogo.co/api/places/'+whereTo+'/food', function(error, response, body) {
                                if(!error && response.statusCode == 200) {
                                    var foodplace = JSON.parse(body);
                                    finalDict["places"] = {}
                                    finalDict["places"]["food"] = foodplace;
                                    request('https://gogogogo.co/api/places/'+whereTo+'/attractions', function(error, response, body) {
                                        var attractionplace = JSON.parse(body);
                                        finalDict["places"]["poi"] = attractionplace;
                                        console.log(finalDict["places"]["poi"]);
                                        if(finalDict["places"]["poi"]) {
                                            res.send(finalDict);
                                        }
                                    });
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