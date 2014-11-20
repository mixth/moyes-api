var moment = require('moment');
var cron = require('cron');
var filename = '/root/workspace/moyes/fetch_url.txt';
var moyes_core = require('./moyes_core');

var fetcher = cron.job('*/30 * * * * *', function () {
	console.info('::Updater running at  ' + moment().format());
	console.info('-----------------------------------');
	moyes_core.manual_fetcher(filename);
});

var remover = cron.job('0 */15 * * * *', function () {
	console.info('-----------------------------------');
	console.info('::Remover running at '  + moment().format());
	moyes_core.manual_remover(filename);
});

fetcher.start();
remover.start();
