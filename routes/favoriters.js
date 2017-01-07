var express = require('express');
var request = require("request");
var config = require('../config');
var APIScrapping = require('./helpers/APIScrapping');
var Queue = require('bee-queue');
var Q = require('q');

var favoriters = {};

favoriters.favorites_count = function(trackId) {
	
	var deferred = Q.defer();
	
	request("https://api.soundcloud.com/tracks/"+trackId+"?consumer_key="+config.consumer_key,
        function(error, response, body) {

        deferred.resolve({favoritings_count: JSON.parse(body).favoritings_count});
    });

	return deferred.promise;
};

favoriters.get = function(trackId) {

	var deferred = Q.defer();

	var favoritersList = [];	
	var next_href = "https://api.soundcloud.com/tracks/"+trackId+"/favoriters.json?consumer_key="+config.consumer_key+"&linked_partitioning=1&page_size=200";
	
	APIScrapping.getResults(next_href, favoritersList).then(function(finalFavoritersList){

		//console.log("============ finalFavoritersList : "+finalFavoritersList);

		if(finalFavoritersList.error) {
			deferred.resolve({error:"Error occured in APIScrapping.getResults with trackId "+trackId+", error: "+e});
		}

		var resultObj = {};
		resultObj[trackId] = finalFavoritersList;
		deferred.resolve(resultObj);
	}).done();

	return deferred.promise;
};

module.exports = favoriters;