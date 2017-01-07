var express = require('express');
var request = require("request");
var config = require('../config')
var Q = require('q');

var resolve = {};

resolve.profile = function(url) {

	var deferred = Q.defer();

	if(!url) {
		res = {error: "No user url specified."};
		deferred.resolve(res);
	}

	request("https://api.soundcloud.com/resolve.json?consumer_key="+config.consumer_key+"&url="+url, 
			function(error, response, body) {
				
		res = {userUri: JSON.parse(body).uri};
		console.log(res);
		deferred.resolve(res);
	});

	return deferred.promise;
};

module.exports = resolve;