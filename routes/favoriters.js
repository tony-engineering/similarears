"use strict";

var express = require('express');
var request = require("request");
var config = require('../config');
var APIScrapping = require('./helpers/APIScrapping');
var Q = require('q');
var Queue = require('bee-queue');

var favoriters = {};

favoriters.favorites_count = function(trackId) {
	
	var deferred = Q.defer();
	
	request("https://api.soundcloud.com/tracks/"+trackId+"?consumer_key="+config.consumer_key,
        function(error, response, body) {

        deferred.resolve({favoritings_count: JSON.parse(body).favoritings_count});
    });

	return deferred.promise;
};

favoriters.get = function(trackId, favoritings_count, mainQueue, mainJobId) {

	var deferred = Q.defer();
	
	var scrappingQueue = new Queue('scrappingQueue');
	scrappingQueue.on('error', function (err) {
		console.log('A queue error happened: ' + err.message);
	});
	var job = scrappingQueue.createJob({trackId:trackId,expectedResultsLength:favoritings_count,mainQueue:mainQueue,mainJobId:mainJobId});
	job.save(function(err, job){
		console.log("CREATED");
		job.on('progress', function (progress) {
			console.log('Track ' + job.data.trackId + ' reported progress: ' + progress + '%');
		});
		job.on('succeeded', function (result) {
			//console.log('Received result for job ' + job.id + ': ' , result);
		});
		job.on('failed', function (err) {
			//console.log('Job ' + job.id + ' failed with error ' + err.message);
		});
	});

	scrappingQueue.process(function (job, done) {
						console.log("Going to process job id : "+job.id);
		
		var next_href = "https://api.soundcloud.com/tracks/"+job.data.trackId+"/favoriters.json?consumer_key="+config.consumer_key+"&linked_partitioning=1&page_size=200";

		APIScrapping.getResults(next_href, [], "addResultsFavoriters", job).then(function(finalFavoritersList){

			if(finalFavoritersList.error) {
				deferred.resolve({error:"Error occured in APIScrapping.getResults with trackId "+trackId+", error: "+e});
			}

			console.log("Going to end job "+job.id);

			var resultObj = {};
			resultObj[trackId] = finalFavoritersList;
			
			deferred.resolve(resultObj);
			return done(null, job.data);
		});
	});

	return deferred.promise;
};

module.exports = favoriters;