"use strict";

var Q = require('q');
var request = require("request");

var APIScrapping = {};

APIScrapping.getResults = function(next_href, inputResultsList, addResultsMethod, job, mainJob, abort) {

	var deferred = Q.defer();
	
	//if(addResultsMethod == "addResultsFavoriters") {
		//abort = true;
	//}
	if(abort) {
		console.log("ABORTED");
		deferred.resolve(inputResultsList);
		return;
	}	

	var options = {
		url: next_href,
		timeout: 999999999
	};
	request(options, function(error, response, body) {

		try {

			if (error || response.statusCode != 200) {
				console.log("Request failed : "+error);
				// retry
			}

			var parsedBody = JSON.parse(body);

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
				// TODO
				
				//job.data.abort = true;
				//console.log("job.data : ", job.data);

				var percent = Math.ceil((newResultsList.length/job.data.expectedResultsLength)*100);
				
				/*if(mainJob.data.percent >= 50 && percent <= 90) {
					parsedBody.next_href = null;
				}*/

				// in case there's new likes while we get favoriters
				if(percent > 100) {
					percent = 100;
				}

				job.reportProgress(percent);
			}

			// Do we continue ?
			// YES
			if(parsedBody.next_href) {

				var abort;
				if(mainJob && mainJob.data.percent >= 95 && percent <= 90) {
					 abort = true;
					 console.log("_______________________________________________ SIGNAL");
				}
				else {
					abort = false;
				}

				return APIScrapping.getResults(parsedBody.next_href, newResultsList, addResultsMethod, job, mainJob, abort).then(function(){
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
		
		// retry
		return APIScrapping.getResults(next_href, inputResultsList, addResultsMethod, job, mainJob, abort).then(function(){
			deferred.resolve(inputResultsList);
		});
	});
	return deferred.promise;
}

APIScrapping.addResultsFavoriters = function(collection, resultsList, job) {

	console.log("addResultsFavoriters : adding [",collection.length+"] to ["+resultsList.length+"]");

	// pushing only URIs
	for(var i=0; i<collection.length; i++) {
		resultsList.push(collection[i].id);
	}

	return resultsList;
}

APIScrapping.addResultsLikes = function(collection, resultsList, job) {

	// pushing only URIs
	for(var i=0; i<collection.length; i++) {
		var obj = {id:collection[i].id, favoritings_count:collection[i].favoritings_count};
		//console.log("obj:",obj);
		resultsList.push(obj);
	}

	return resultsList;
}

module.exports = APIScrapping;