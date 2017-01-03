var Q = require('q');
var request = require("request");

var APIScrapping = {};

APIScrapping.getResults = function(next_href, resultsList) {
	
	var deferred = Q.defer();
	request(next_href, function(error, response, body) {

		var parsedBody = JSON.parse(body);

		resultsList = APIScrapping.addResultsToList(parsedBody.collection, resultsList);
		console.log("list length in req:",resultsList.length);

		// Do we continue ?
		// YES
		if(parsedBody.next_href) {

			APIScrapping.getResults(parsedBody.next_href, resultsList).then(function(){
				deferred.resolve(resultsList);
			});
		}
		// NO
		else {
			console.log("END");
			deferred.resolve(resultsList);
		}
	});
	return deferred.promise;
}

APIScrapping.addResultsToList = function(collection, resultsList) {

	// pushing only URIs
	for(i=0; i<collection.length; i++) {
		resultsList.push(collection[i].id);
	}

	return resultsList;
}

module.exports = APIScrapping;