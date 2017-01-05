var Q = require('q');
var request = require("request");

var APIScrapping = {};

APIScrapping.getResults = function(next_href, inputResultsList) {
	
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

			//var newResultsList;
			var newResultsList = APIScrapping.addResultsToList(parsedBody.collection, inputResultsList);
			//console.log("list length in req:",newResultsList.length);

			// Do we continue ?
			// YES
			if(parsedBody.next_href) {

				return APIScrapping.getResults(parsedBody.next_href, newResultsList).then(function(){
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
			console.log("body : "+body);
			//process.exit();
			deferred.resolve({error: "Got error for ressource : "+next_href+", error : "+ e});
		}
	}).on('error', function(err) {
		console.log("err:"+err);
		process.exit();
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