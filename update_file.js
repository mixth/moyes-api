var fs = require('fs');
var urlFile = 'fetch_url.txt';
var targetFile = 'league_id.txt';

var url = fs.readFileSync(urlFile);
var url = JSON.parse(url);
var leagueId = [];
for (var i = 0; i < url.length; i++)
	leagueId.push(url[i].id);

fs.writeFile(targetFile, JSON.stringify(leagueId, null, 4));

