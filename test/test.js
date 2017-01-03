var expect = require('expect.js');
var assert = require('assert');
var request = require("request");

describe('PROFILE TESTS', function() {
	
    it('Resolve soundcloud user profile url', function(done) {
		
		url = "https://soundcloud.com/xtonex";
		
		request("http://localhost:3000/resolve-profile-uri?url="+url,
			function(error, response, body) {
			
			responseObj = JSON.parse(body);
			expect(responseObj.userUri).equal('https://api.soundcloud.com/users/5912982');
			done();
		});
    });
	
	it('Should count favoriters for one track and then get all these favoriters', function(done) {
		this.timeout(10000);

		trackId = "285989934";
		
		request("http://localhost:3000/favoriters/favoritings-count?trackId="+trackId,
			function(error, response, body) {

			responseObj_track_count = JSON.parse(body);
			expect(responseObj_track_count.favoritings_count).to.be.greaterThan(1970);

			request("http://localhost:3000/favoriters/get?trackId="+trackId,
				function(error, response, body) {

				responseObj_track_get = JSON.parse(body);
				expect(responseObj_track_get.length).to.be.greaterThan(1800);
				done();
			});
		});		
    });
	
	it('Should get all user\'s likes', function(done) {
		this.timeout(10000);
		
		url = encodeURIComponent("https://soundcloud.com/xtonex");
		
		request("http://localhost:3000/resolve-profile-uri?url="+url,
			function(error, response, body) {
			
			responseObj = JSON.parse(body);
				
			request("http://localhost:3000/likes/all?uri="+responseObj.userUri,
				function(error, response, body) {
				
				responseObj_likes = JSON.parse(body);
				expect(responseObj_likes.likes.length).equal(1236);
				done();
			});
		});
    });
	
});