var express = require('express');
var router = express.Router();
var request = require("request");
var config = require('../config');
var likes = require('./likes');
var favoriters = require('./favoriters');
var Q = require('q');
var fs = require('fs');

router.get('/get-all-data', function(req, res, next) {
	req.setTimeout(0);

	var url = req.query.url;

    request("http://localhost:3000/resolve-profile-uri?url="+url,
        function(error, response, body) {
        
        responseObj = JSON.parse(body);
            
        request("http://localhost:3000/likes/all?uri="+responseObj.userUri,
            function(error, response, body) {
            
            var responseObj_likes = JSON.parse(body);
            var allData = [];
            var promises = [];
            var ranking = {};
            var writeStream = fs.createWriteStream("output.json");
            writeStream.write("{");

            var limit = responseObj_likes.likes.length;
            //var limit = 2;
            for(var i=0; i<limit; i++) {
                var trackId = responseObj_likes.likes[i];
                if(trackId == "249465206") continue;

                var promiseTrackid = getFavoriters(trackId, allData).then(function(favoritersForThisTrack){

                    if(!favoritersForThisTrack.error) {
                        var processingTrackId =  Object.keys(favoritersForThisTrack)[0];
                        writeStream.write('"'+processingTrackId+'":'+JSON.stringify(favoritersForThisTrack[processingTrackId]));
                    }
                    else {
                        var error = favoritersForThisTrack;
                        writeStream.write(JSON.stringify(error));
                    }

                    writeStream.write(",");
                });
                promises.push(promiseTrackid);
            }

            Q.all(promises).then(function() {

                console.log("all finished");
                console.log("ranking length at the end : "+Object.keys(ranking).length);
                
                writeStream.write("}");
                writeStream.end();

                /*sortedRanking = [];
                Object.keys(ranking)
                .map(function (k) { return [k, ranking[k]]; })
                .sort(function (a, b) {
                    if (a[1] < b[1]) return 1;
                    if (a[1] > b[1]) return -1;
                    return 0;
                })
                .forEach(function (d) {
                    sortedRanking.push([d[0], d[1]]);
                });*/

                //res.json({ranking: sortedRanking});
                res.json({result: "File created"});
            }).done();
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
    var options = {
		url: "http://localhost:3000/favoriters/get?trackId="+trackId,
		timeout: 999999999
	};
    request(options, function(error, response, body) {

        try {
            responseObj_track_get = JSON.parse(body);
            deferred.resolve(responseObj_track_get);
        } catch(e) {
            console.log("Parsing error occured in getFavoriters with trackId "+trackId+", error: ",e);
            console.log("body:"+body);
            console.log("response:",response);
            console.log("error:",error);
            deferred.resolve({error:"Parsing error occured in getFavoriters with trackId "+trackId+", error: "+e});
            process.exit();
        }
    });
    return deferred.promise;
}

module.exports = router;