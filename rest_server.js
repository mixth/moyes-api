var express = require('express');
var bodyParser = require('body-parser');


var databaseUrl = 'moyes';
//var collections = 'premier-league';

//var db = require('mongojs').connect (databaseUrl, collections);
var ObjectId = require('mongojs').ObjectId;


function getAllMatch(league, callback)
{
	var collections = league;
	var db = require('mongojs').connect(databaseUrl, [collections]);
	db[collections].find().toArray(function (err, items)
	{
		callback(items);
	});
}

function getMatch(league, team, callback)
{
        var collections = league;
        var db = require('mongojs').connect(databaseUrl, [collections]);
        db[collections].find({$or: [{"team1" : team}, {"team2" : team}]}).toArray(function (err, items)
        {
                callback(items);
        });
}


var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

app.get('/moyes/:league', function (req, res) {
	var league = req.params.league;
        league = league.toLowerCase ();

	getAllMatch(league, function(info) {
		if (info == null)
		{
			info = {
				successful : 0
			};
		}
		else
		{
			info ["successful"] = 1;
		}
		res.json(info);
	});
});

app.get('/moyes/:league/:team', function (req, res) {
        var league = req.params.league;
        league = league.toLowerCase();

	var team = req.params.team;
	team = team.replace(/\s+/g, "-");	
	team = team.toLowerCase();

        getMatch(league, team, function(info) {
                if (info == null)
                {
                        info = {
                                successful : 0
                        };
                }
                else
                {
                        info ["successful"] = 1;
                }
                res.json(info);
        });
});


app.listen(3000);
console.log("while(plex); :: Project Moyes API is running at port 3000");
