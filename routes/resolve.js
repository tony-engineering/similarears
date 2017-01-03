var express = require('express');
var router = express.Router();
var request = require("request");
var config = require('../config')

/* GET home page. */
router.get('/resolve-profile-uri', function(req, res, next) {
	
	url = req.query.url;
	
	if(!url) {
		res.json({error: "No user url specified."});
	}
	
	request("https://api.soundcloud.com/resolve.json?consumer_key="+config.consumer_key+"&url="+url, 
			function(error, response, body) {
				
		res.json({userUri: JSON.parse(body).uri});
	});
  
});

module.exports = router;
