var sys = require('sys'),
	http = require('http'),
	url = require('url');

function toHexDigit(n) {
    return '0123456789abcdef'[n];
}

function escapeBinary(s) {
    // Node's querystring.stringify doesn't escape binary strings
    // correctly. (It inserts escape charcters. Not sure why, maybe
    // it is treating the data as UTF8 encoded or some other encoding.)
    var result = '', i, len, c, cc;
    s = '' + s;
    for (i = 0, len = s.length; i < len; i += 1) {
        c = s.charAt(i);
        if ((c >= '0' && c <= '9') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
        	  || (c == '.' || c == '-' || c == '_' || c == '~')) {
      	    result += c;
        } else {
            cc = s.charCodeAt(i);
            result += '%' + toHexDigit(0xf & (cc >> 4)) + toHexDigit(0xf & cc);
        }
    }
    return result;
}

function queryStringify(params) {
	var result = '', key, first = true;
	for (key in params) {
	    if (params.hasOwnProperty(key)) {
	        if (first) {
	            first = false;
	        } else {
	            result += '&';
	        }
	        result += key + '=' + escapeBinary(params[key]);
	    }
	}
	return result;
}

function create(metaInfo) {
	var announce = metaInfo.announce,
		parsedUrl = url.parse(announce),
		port = parsedUrl.port ? parsedUrl.port : 80;
	return {metaInfo: metaInfo,
		tracker: http.createClient(port, parsedUrl.hostname),
		trackerRelativeUri: parsedUrl.pathname,
		host: parsedUrl.hostname,
		peers: {}};
}

function ping(trackerClient, params, callback) {
	var path = trackerClient.trackerRelativeUri + '?' +
		queryStringify(params),
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
