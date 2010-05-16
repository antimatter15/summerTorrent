var sys = require('sys'),
	http = require('http'),
	url = require('url'),
	querystring = require('querystring');

function create(metaInfo) {
	var announce = metaInfo.announce,
		parsedUrl = url.parse(announce);
	return {metaInfo: metaInfo,
		tracker: http.createClient(parsedUrl.port, parsedUrl.hostname),
		trackerRelativeUri: parsedUrl.pathname,
		host: parsedUrl.hostname,
		peers: {}};
}

function ping(trackerClient, params, callback) {
	var path = trackerClient.trackerRelativeUri + '?' +
		querystring.stringify(params),
		request = trackerClient.tracker.request('GET', path,
			{'host': trackerClient.host});
	sys.log('path:' + path);
	request.addListener('response', function (response) {
		sys.puts('STATUS: ' + response.statusCode);
		sys.puts('HEADERS: ' + JSON.stringify(response.headers));
		response.setEncoding('binary');
		response.addListener('data', function (chunk) {
			sys.puts('BODY: ' + chunk);
		});
	});
	request.end();
}

exports.create = create;
exports.ping = ping;
