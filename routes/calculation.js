var express = require('express');
var router = express.Router();
var request = require("request");
var config = require('../config');
var likes = require('./likes');
var favoriters = require('./favoriters');
var Q = require('q');

router.get('/get-all-data', function(req, res, next) {
	
	var url = req.query.url;

    request("http://localhost:3000/resolve-profile-uri?url="+url,
        function(error, response, body) {
        
        responseObj = JSON.parse(body);
            
        request("http://localhost:3000/likes/all?uri="+responseObj.userUri,
            function(error, response, body) {
            
            var responseObj_likes = JSON.parse(body);
            var allData = {};
            var promises = [];

            var limit = responseObj_likes.likes.length;
            for(i=0; i<limit; i++) {
                var trackId = responseObj_likes.likes[i];
                var promiseTrackid = getFavoriters(trackId, allData);
                promises.push(promiseTrackid);
            }

            Q.all(promises).then(function() {

                console.log("all finished");
                console.log("-------allData:"+allData);
                res.json(allData);
            });
        });
    });
});

router.get('/analyse-data', function(req, res, next){

    var url = req.query.url;

    request("http://localhost:3000/calculation/get-all-data?url="+url,
        function(error, response, body) {
        
        console.log("body----------:"+body);

        var allData = JSON.parse(body);
        var ranking = {};

        for(var trackId in allData) {
            
            var favoritersForThisTrack = allData[trackId];
            favoritersForThisTrack.forEach(function(favoriter, index){
                if(ranking[favoriter]) {
                    ranking[favoriter]++;
                }
                else {
                    ranking[favoriter] = 0;
                }
            });
        }

        res.json({results: ranking});
    });
});

function getFavoriters(trackId, allData) {

    var deferred = Q.defer();
    request("http://localhost:3000/favoriters/get?trackId="+trackId,
        function(error, response, body) {

        responseObj_track_get = JSON.parse(body);
        allData[trackId] = responseObj_track_get.favoriters;
        deferred.resolve();
    });
    return deferred.promise;
}

module.exports = router;