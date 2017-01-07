var express = require('express');
var router = express.Router();
var config = require('../config');
var APIScrapping = require('./helpers/APIScrapping');
var Q = require('q');

var likes = {};

/* GET all likes from user. */
likes.all = function(userUri) {
	
	var deferred = Q.defer();

	var likesList = [];
	var next_href = userUri+"/favorites.json?consumer_key="+config.consumer_key+"&linked_partitioning=1&page_size=200";
	
	APIScrapping.getResults(next_href, likesList).then(function(finalLikesList){
		deferred.resolve({likes: finalLikesList});
	}).done();

	return deferred.promise;
};

module.exports = likes;