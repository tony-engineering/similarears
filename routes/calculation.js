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
            var mainQueue = undefined;
            var mainJob = undefined;
			
			console.log("responseObj_likes: ", responseObj_likes);
			
            mainQueue = new Queue('mainQueue'+new Date().getTime());
            mainQueue.on('error', function (err) {
                console.log('A queue error happened: ' + err.message);
            });
            mainJob = mainQueue.createJob({numberProcessed:0,numberToProcess:responseObj_likes.likes.length});
            mainJob.save(function(err, mainJob){
                console.log("CREATED");
				res.json({result: "Job created."});
                mainJob.on('progress', function (progress) {
                    console.log('### gettting favs , reported progress: ' + progress + '%');
                });
                mainJob.on('succeeded', function (result) {
                    
                });
                mainJob.on('failed', function (err) {
                    console.log('Job ' + mainJob.id + ' failed with error ' + err.message);
                });
            });

            mainQueue.process(function (mainJobParam, done) {
                console.log("############## job.data: ",mainJobParam.data);
                
                writeStream.write("{");

                var limit = responseObj_likes.likes.length;
                //var limit = 1;
                for(var i=0; i<limit; i++) {

                    var trackId = responseObj_likes.likes[i].id;
                    var favoritings_count = responseObj_likes.likes[i].favoritings_count;

                    // TODO : get nb favoriters then be able to skip if too much

                    var promiseTrackid = favoriters.get(trackId, favoritings_count, mainJobParam).then(favoritersForThisTrack => {

                        if(!favoritersForThisTrack.error) {
                            var processingTrackId =  Object.keys(favoritersForThisTrack)[0];
                            writeStream.write('"'+processingTrackId+'":'+JSON.stringify(favoritersForThisTrack[processingTrackId]));
                        }
                        else {
                            var error = favoritersForThisTrack;
                            writeStream.write('"'+error.trackId+'":'+JSON.stringify(error));
                        }

                        // if it's not the last data to print in JSON file
                        //if(job.data.numberProcessed-1 != job.data.numberToProcess) {
                            writeStream.write(",");
                        //}
                        
                        var percent = Math.ceil((mainJobParam.data.numberProcessed++/mainJobParam.data.numberToProcess)*100);
                        // keep it in data to be able to access it in scrappingQueue jobs
                        mainJobParam.data.percent = percent;
                        // report it
                        mainJobParam.reportProgress(percent);
                        // for tests
                        //if(percent > 60) {
                          //  process.exit(0);
                        //}
                        console.log("OK");

                    });
                    promises.push(promiseTrackid);
                }

                Q.all(promises).then(function() {

					var deferred = Q.defer();
					
                    console.log("getting all favoriters for all musics finished");
                    
                    writeStream.write("}", function() {});
                    writeStream.end();

                    fs.rename("output.json", new Date().getTime()+".json", function(){});

					//done(null, mainJob.data);
					
					//res.json({res:"Done"});
					
                });
            });
        });
    });
});

router.get('/analyse-data', function(req, res, next){

    var filename = req.query.filename;
    var minReapparition = req.query.minReapparition;
	var stringFile = fs.readFileSync(filename);
	var allData = JSON.parse(stringFile);
	var ranking = {};
    var sortedRanking = [];

    // Counting favoriters occurences
	for(var trackId in allData) {

		var favoritersForThisTrack = allData[trackId];

        if(!favoritersForThisTrack.error) {
            for(var i = 0; i<favoritersForThisTrack.length; i++) {

                var favoriter = favoritersForThisTrack[i];

                if(ranking[favoriter] != null) {
                    ranking[favoriter]++;
                }
                else {
                    ranking[favoriter] = 0;
                }
            }
        }
	}

    // Sorting
    Object.keys(ranking)
    .map(function (k) { return [k, ranking[k]]; })
    .sort(function (a, b) {
        if (a[1] < b[1]) return 1;
        if (a[1] > b[1]) return -1;
        return 0;
    })
    .forEach(function (d) {
        sortedRanking.push([d[0], d[1]]);
    });

    // Cleaning favoriters appearing just 1 time
    sortedRanking = sortedRanking.filter(function(favoriter) {
        return favoriter[1] >= minReapparition;
    });
	
    // Returning
	res.json({ranking:sortedRanking});
});

router.get('/get-infos-favoriter', function(req, res, next){

    var userId = req.query.userId;
    
    favoriters.getFavoriterInfos(userId).then(function(favoriterInfos){
        res.json(favoriterInfos);
    }).done();
});

router.get('/launch', function(req, res, next){

    res.render('index', { title: 'Similarears' });
});

module.exports = router;