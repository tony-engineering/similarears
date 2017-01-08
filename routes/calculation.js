"use strict";

var express = require('express');
var router = express.Router();
var request = require("request");
var config = require('../config');
var likes = require('./likes');
var resolve = require('./resolve');
var favoriters = require('./favoriters');
var Q = require('q');
var fs = require('fs');
var Queue = require('bee-queue');

router.get('/get-all-data', function(req, res, next) {
	req.setTimeout(0);

	var url = req.query.url;
    resolve.profile(url).then(function(result) {

        likes.all(result.userUri).then(function(responseObj_likes) {
            
            var promises = [];
            var ranking = {};
            var writeStream = fs.createWriteStream("output.json");
            writeStream.write("{");

            var mainQueue = new Queue('scrappingQueue');
            mainQueue.on('error', function (err) {
                console.log('A queue error happened: ' + err.message);
            });
            var mainJob = mainQueue.createJob({numberProcessed:0,numberToProcess:responseObj_likes.likes.length});
            mainJob.save(function(err, job){
                console.log("CREATED");
                mainJob.on('progress', function (progress) {
                    console.log('### gettting favs , reported progress: ' + progress + '%');
                });
                mainJob.on('succeeded', function (result) {
                    //console.log('Received result for job ' + job.id + ': ' , result);
                });
                mainJob.on('failed', function (err) {
                    console.log('Job ' + mainJob.id + ' failed with error ' + err.message);
                });
            });

            mainQueue.process(function (mainJob, done) {

                var limit = responseObj_likes.likes.length;
                //var limit = 1;
                for(var i=0; i<limit; i++) {

                    console.log("---------------- "+i);

                    var trackId = responseObj_likes.likes[i].id;
                    var favoritings_count = responseObj_likes.likes[i].favoritings_count;

                    // TODO : get nb favoriters then be able to skip if too much

                    var promiseTrackid = favoriters.get(trackId, favoritings_count, mainQueue, mainJob.id).then(function(favoritersForThisTrack) {

                        if(!favoritersForThisTrack.error) {
                            var processingTrackId =  Object.keys(favoritersForThisTrack)[0];
                            writeStream.write('"'+processingTrackId+'":'+JSON.stringify(favoritersForThisTrack[processingTrackId]));
                        }
                        else {
                            var error = favoritersForThisTrack;
                            writeStream.write(JSON.stringify(error));
                        }

                        writeStream.write(",");
                        //console.log("### job.data.numberToProcess : "+job.data.numberToProcess);
                        var percent = Math.ceil((mainJob.data.numberProcessed++/mainJob.data.numberToProcess)*100);
                        mainJob.reportProgress(percent);
                    });
                    promises.push(promiseTrackid);
                }

                Q.all(promises).then(function() {

                    return done(null, mainJob.data);

                    console.log("getting all favoriters for all musics finished");
                    
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
        }).done();
    }).done();
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

module.exports = router;