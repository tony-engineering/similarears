var express = require('express');
var router = express.Router();
var request = require("request");
var config = require('../config');
var APIScrapping = require('./helpers/APIScrapping');

router.get('/favoritings-count', function(req, res, next) {
	
	var trackId = req.query.trackId;
	
	request("https://api.soundcloud.com/tracks/"+trackId+"?consumer_key="+config.consumer_key,
        function(error, response, body) {
        
        responseObj_track_count = JSON.parse(body);
        res.json({favoritings_count: responseObj_track_count.favoritings_count});
    });
});

router.get('/get', function(req, res, next) {
	
	var favoritersList = [];
	var trackId = req.query.trackId;
	
	var next_href = "https://api.soundcloud.com/tracks/"+trackId+"/favoriters.json?consumer_key="+config.consumer_key+"&linked_partitioning=1&page_size=200";
	
	APIScrapping.getResults(next_href, favoritersList).then(function(finalFavoritersList){

		res.json({favoriters: finalFavoritersList});
	});
});

module.exports = router;