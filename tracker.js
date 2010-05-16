var sys = require('sys'),
	http = require('http'),
	parseUri = require('./vendors/stevenlevithan/parseUri');

function create(metaInfo) {
	var announce = metaInfo.announce,
		uri = parseUri.parseUri(announce);
	return {metaInfo: metaInfo,
		tracker: http.createClient(uri.port, uri.host),
		trackerRelativeUri: uri.relative,
		peers: {}};
}

function ping(trackerClient, params, callback) {
	sys.log('ping ' + trackerClient.metaInfo.announce + ' ' + JSON.stringify(params));
}

exports.create = create;
exports.ping = ping;