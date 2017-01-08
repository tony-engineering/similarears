"use strict";

var Q = require('q');
var request = require("request");

var APIScrapping = {};

APIScrapping.getResults = function(next_href, inputResultsList, addResultsMethod, job) {

	APIScrapping.addResults = addResultsMethod;
	var deferred = Q.defer();
	var options = {
		url: next_href,
		timeout: 999999999
	};
	request(options, function(error, response, body) {

		try {

			if (error || response.statusCode != 200) {
				throw "Request failed : "+error;
			}

			var parsedBody = JSON.parse(body);

			if(job)
			console.log(job.data.trackId +", begin inputResultsList.length: "+inputResultsList.length);

			//var newResultsList;
			if(addResultsMethod == "addResultsFavoriters") {
				var newResultsList = APIScrapping.addResultsFavoriters(parsedBody.collection, inputResultsList);
			}
			else {
				var newResultsList = APIScrapping.addResultsLikes(parsedBody.collection, inputResultsList);
			}
			//console.log("list length in req:",newResultsList.length);

			if(job) {
				
				// get mainJob progress to know if we have enough favoriters
				// (it takes a while to get favoriters for famous tracks, so we decide to abort)
				job.data.mainQueue.getJob(job.data.mainJobId, function (err, job) {
					console.log('------------------------- Job '+job.data.mainJobId+' has status ' + job.status);
				});

				var percent = Math.ceil((newResultsList.length/job.job.data.expectedResultsLength)*100);
				
				// in case there's new likes while we get favoriters
				if(percent > 100) {
					percent = 100;
				}

				job.reportProgress(percent);
			}

			// Do we continue ?
			// YES
			if(parsedBody.next_href) {
				return APIScrapping.getResults(parsedBody.next_href, newResultsList, "addResultsFavoriters", job).then(function(){
					deferred.resolve(newResultsList);
				});
			}
			// NO
			else {
				console.log("END");
				deferred.resolve(newResultsList);
			}
		}
		catch(e) {
			console.log("Got error for ressource : "+next_href+", error : ", e);
			//console.log("body : "+body);
			//process.exit();
			deferred.resolve({error: "Got error for ressource : "+next_href+", error : "+ e});
		}
	}).on('error', function(err) {
		console.log("err:"+err);
		process.exit();
	});
	return deferred.promise;
}

APIScrapping.addResultsFavoriters = function(collection, resultsList) {

	console.log("addResultsFavoriters : adding [",collection.length+"] to ["+resultsList.length+"]");

	// pushing only URIs
	for(var i=0; i<collection.length; i++) {
		resultsList.push(collection[i].id);
	}

	return resultsList;
}

APIScrapping.addResultsLikes = function(collection, resultsList) {

	// pushing only URIs
	for(var i=0; i<collection.length; i++) {
		var obj = {id:collection[i].id, favoritings_count:collection[i].favoritings_count};
		//console.log("obj:",obj);
		resultsList.push(obj);
	}

	return resultsList;
}

module.exports = APIScrapping;