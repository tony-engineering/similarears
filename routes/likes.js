var express = require('express');
var router = express.Router();
var request = require("request");
var config = require('../config');
var Q = require('q');

/* GET all likes from user. */
router.get('/all', function(req, res, next) {
	
	var fullLikesList = [];
	var userUri = req.query.uri;
	
	var next_href = userUri+"/favorites.json?consumer_key="+config.consumer_key+"&linked_partitioning=1&page_size=200";
	
	getNextLikes(next_href, fullLikesList).then(function(likes){

		res.json({likes: likes});
	});
});

function getNextLikes(next_href, fullLikesList) {
	
	console.log(next_href);

	var deferred = Q.defer();
	request(next_href, function(error, response, body) {

		var parsedBody = JSON.parse(body);

		fullLikesList = addLikesToList(parsedBody.collection, fullLikesList);
		console.log("full likes list length in req:",fullLikesList.length);

		// Do we continue ?
		// YES
		if(parsedBody.next_href) {

			getNextLikes(parsedBody.next_href, fullLikesList).then(function(){
				deferred.resolve(fullLikesList);
			});
		}
		// NO
		else {
			console.log("END");
			deferred.resolve(fullLikesList);
		}
	});
	return deferred.promise;
}

function addLikesToList(likesCollection, fullLikesList) {

	// pushing only URIs
	for(i=0; i<likesCollection.length; i++) {
		fullLikesList.push(likesCollection[i].uri);
	}

	return fullLikesList;
}

router.get('/count', function(req, res, next) {
	
	var userUri = req.query.uri;
	
	request(userUri+"?consumer_key="+config.consumer_key,
			function(error, response, body) {
				
		res.json({likes_count: JSON.parse(body).public_favorites_count});
	});
});

module.exports = router;
