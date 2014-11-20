exports.manual_fetcher = function (filename) {
	var cheerio = require("cheerio");
	var http = require('http');
	var fs = require('fs');
	var moment = require('moment');
	var ObjectId = require('mongojs').ObjectId;

	var debug = true;

	function download(url, callback) {
	  http.get(url, function(res) {
		var data = "";
		res.on('data', function (chunk) {
		  data += chunk;
		});
		res.on("end", function() {
		  callback(data);
		});
	  }).on("error", function() {
		callback(null);
	  });
	}

	// Initialize targetUrl for fetching
	var targetFile = fs.readFileSync(filename);
	var targetUrl = JSON.parse(targetFile);
	var targetCollections = [];
	for (var i = 0; i < targetUrl.length; i++)
		targetCollections.push(targetUrl[i].id);

	console.log(targetCollections);
	var databaseName = 'moyes';
	var db = require('mongojs').connect(databaseName, targetCollections);


	// Download each url and fetch data
	for (var i = 0; i < targetUrl.length; i++)
	{
		var collection = targetUrl[i].id;
		download(targetUrl[i].url, function(data) {
			var collection_download = this.collection;
			if (data) {
				//console.log(data);
				//fs.writeFile('test.html', data);
				var latestReadDate; 
				var $ = cheerio.load(data);
					$("table.league-table > tr").each(function(i, e) {
					var collection_dollar = this.collection_download;
					var liveMatch = false;
					var time = $(e).find("td.fd").text().trim();
					// Detect that this is a match entry
					if (time != "")
					{
						var start;
						var match = {};
						var startMoment;
						if (time.match(/:/g) == ':')
						{
							// Convert play time to ISO time
							var sumTime = this.latestReadDate + "2014 " + time + " +0000";
							startMoment = moment(sumTime, " MMMM D YYYY HH:mm Z");
							match.start = new Date(startMoment.format());
							match.time = 'N/A';
						}
						else
						{
							liveMatch = true;
							match.time = time.trim();
							if (match.time == 'FT')
							{
								var sumTime = this.latestReadDate + "2014 23:59 +0000";
								//console.info("> " + sumTime);
								match.start = new Date(moment(sumTime, " MMMM D YYYY HH:mm Z").format());
							}
						}
						// Select data and transfer to match object
						match.team1 = $(e).find("td.fh").text();
						match.team1 = match.team1.trim().toLowerCase().replace(/\s+/g, '-');
						score = $(e).find("td.fs > a").text();

						var score1 = score.match(/\d\s/g);
						if (score1)
							match.score1 = score1[0].trim();

						var score2 = score.match(/\s\d/g);
						if (score2)
							match.score2 = score2[0].trim();

						match.team2 = $(e).find("td.fa").text();
						match.team2 = match.team2.trim().toLowerCase().replace(/\s+/g, '-');
						//console.log(match.time + ' | ' + match.team1 + " " + match.score1 + " - " + match.score2 + match.team2);

						// Try to match the match with existing match in DB
						db[collection_dollar].find({'team1' : match.team1, 'team2' : match.team2}, function (err, searchResult) {
							// If the match is found, update with new information
							if (searchResult.length > 0)
							{
								// Does the match start? If not, we may not need to update a thing
								if (match.start && searchResult[0].start && !liveMatch)
								{
									if (match.start.getTime() != searchResult[0].start.getTime())
									{
										if (debug) console.log('--new: ' + match.start.getTime() + ', local: ' + searchResult[0].start.getTime());
										if (debug) console.log('--update new time for ' + match.team1 + ' - ' + match.team2);
										db[this.collection_dollar].update({_id : ObjectId(searchResult[0]._id)}, 
											{$set: { 
												"start" : match.start
												}
											}
										);
									}
								}
								// Else we will update score and time anyway
								else
								{
									if (searchResult[0].time != match.time || searchResult[0].score1 != match.score1 || searchResult[0].score2 != match.score2)
									{
										if (debug) console.log('--update ' + match.team1 + ' - ' + match.team2);
										db[this.collection_dollar].update({_id : ObjectId(searchResult[0]._id)}, 
											{$set: {
												"time" : match.time, 
												"score1" : match.score1, 
												"score2" : match.score2
												}
											}
										);
									}
								}
							}
							// If we cannot find this match in our db, we will insert it if it's valid our selected time gap
							else
							{
								var now = moment();
								// If match.start is never set, this is a live match, add now as its start time
								if (!match.start)
								{
									if (debug) console.log('live match: insert ' + match.team1 + ' - ' + match.team2);
									match.start = new Date(now.format());
									db[this.collection_dollar].insert(match);
								}
								else
								{
									var hourGap = 12;
									// Check if the match is within 12 hours of now, if yes, add it to the system
									if (Math.abs(now.format('x') - match.start.getTime()) <= (1000*60*60*hourGap))
									{
										if (debug) console.log('insert ' + match.team1 + ' - ' + match.team2);
										db[this.collection_dollar].insert(match);
									}
									else
									{
										if (debug) console.log(now.format('x') + ', ' + match.start.getTime());
										if (debug) console.log('time is not valid, ' + match.team1 + ' - ' + match.team2);
									}
								}
							}
						}.bind({collection_dollar:collection_dollar}));
					}
					// Detect that this is a date entry
					else
					{
						var date = $(e).find('span.date').text();
						this.latestReadDate = date;
						//console.log(">> " + latestReadDate);
					}
				}.bind({collection_download:collection_download, latestReadDate:latestReadDate}));
				//console.log("done");
			}
			else console.log("error");  
		}.bind({collection:collection}));
	}
}

exports.manual_remover = function (filename) {
	var fs = require('fs');
	var moment = require('moment');
	var ObjectId = require('mongojs').ObjectId;
	var debug = true;

	// Read id and url from file
	var targetFile = fs.readFileSync(filename);
	var targetUrl = JSON.parse(targetFile);
	var targetCollections = [];
	for (var i = 0; i < targetUrl.length; i++)
			targetCollections.push(targetUrl[i].id);

	console.log(targetCollections);
	var databaseName = 'moyes';
	var db = require('mongojs').connect(databaseName, targetCollections);

	for (var i = 0; i < targetCollections.length; i++)
	{
		db[targetCollections[i]].find({}, function (err, matches) {
			if (err || !matches)
				console.log('error while getting data from mongo');
			else
			{
				var now = moment();
				for (var j = 0; j < matches.length; j++)
				{
					var hourGap = 12;
					var matchDate = moment(matches[j].start.getTime(), 'x');
					if (Math.abs(now.unix() - matchDate.unix()) >= (60*60*hourGap))
					{
						if (debug) console.log('now: ' + now.format() + ', start: ' + matchDate.format());
						if (debug) console.log('found and delete ' + matches[j].team1 + ' - ' + matches[j].team2);
						db[targetCollections[this.i]].remove({_id : ObjectId(matches[j]._id)});
					}
				}
			}
		}.bind({i:i}));
	}
}
