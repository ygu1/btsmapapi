var https = require('https');
var Promise = require('promise');
var options = {
  host: 'maps.googleapis.com',
  method: 'GET'
};
var googlApiKey = 'AIzaSyCUZtDL57ZAjGRZtPVV2_eTIcH4MqsNLnY';

function getGpsCoordinate(location){
  return new Promise(function(resolve, reject) {
    var path = '/maps/api/geocode/json?address='+location+'&key='+googlApiKey;
    options.path = path;
    var request = https.request(options, function(response) {
      var data = '';
      response.setEncoding('utf8');
      if (response.statusCode!=200) reject(response.statusCode);
      else {
        response.on('data', function (chunk) {
          data += chunk;
        });
        response.on('end',function(){
          json = JSON.parse(data);
          console.log(json);
          if (json.status != 'OK') reject(json.status);
          else resolve(json.results[0].geometry.location);
        });
      }
    });
    request.end();
    request.on('error',function(e){
      reject(e);
    });
  });
};

function getTimeZone(coordinate){
  return new Promise(function(resolve, reject) {
    var timestamp = Math.floor(new Date().getTime()/1000);
    path = '/maps/api/timezone/json?location='+coordinate.lat+','+coordinate.lng+'&timestamp='+timestamp+'&key='+googlApiKey;
    options.path = path;
    var req = https.request(options, function(res) {
      var data = '';
      res.setEncoding('utf8');
      if (res.statusCode!=200) reject(res.statusCode);
      else {
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end',function(){
          json = JSON.parse(data);
          var time = json.rawOffset/3600+json.dstOffset/3600;
          var result = {'Timezone':'UTC'+time}
          resolve(JSON.stringify(result));
        });
      }
    });
    req.end();
    req.on('error',function(e){
      reject(e);
    });
  });
};

// transfer location(city, state, country) info to gps coordinate
module.exports.getGpsCoordinate = function(req,res) {
  getGpsCoordinate(req.params.location).then(function (gpsLocation) {
    res.send(gpsLocation);
  })
  .catch(function (error) {
    console.error('An error occurred', error);
  });
};

// transfer gps coordinate to time zone
module.exports.getTimeZone = function(req,res) {
  getGpsCoordinate(req.params.location).then(function (gpsLocation) {
    getTimeZone(gpsLocation).then(function (timeZone) {
      res.send(timeZone);
    })
    .catch(function (error) {
      console.error('An error occurred', error);
    });
  })
  .catch(function (error) {
    console.error('An error occurred', error);
  });
};
