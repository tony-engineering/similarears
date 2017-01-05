var express = require('express');
var router = express.Router();
var config = require('../config');
var APIScrapping = require('./helpers/APIScrapping');

/* GET all likes from user. */
router.get('/all', function(req, res, next) {
	
	var likesList = [];
	var userUri = req.query.uri;
	
	var next_href = userUri+"/favorites.json?consumer_key="+config.consumer_key+"&linked_partitioning=1&page_size=200";
	
	return APIScrapping.getResults(next_href, likesList).then(function(finalLikesList){

		res.json({likes: finalLikesList});
	});
});

module.exports = router;
