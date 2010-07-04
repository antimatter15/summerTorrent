var sys = require('sys'), http = require('http'), bencode = require('bencode'), url = require('url');

function toHexDigit(n){
    return '0123456789abcdef'[n];
}

function escapeBinary(s){
    // Node's querystring.stringify doesn't escape binary strings
    // correctly. (It inserts escape charcters. Not sure why, maybe
    // it is treating the data as UTF8 encoded or some other encoding.)
    var result = '', i, len, c, cc;
    s = '' + s;
    for (i = 0, len = s.length; i < len; i += 1) {
        c = s.charAt(i);
        if ((c >= '0' && c <= '9') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
        (c == '.' || c == '-' || c == '_' || c == '~')) {
            result += c;
        }
        else {
            cc = s.charCodeAt(i);
            result += '%' + toHexDigit(0xf & (cc >> 4)) + toHexDigit(0xf & cc);
        }
    }
    return result;
}

function queryStringify(params){
    var result = '', key, first = true;
    for (key in params) {
        if (params.hasOwnProperty(key)) {
            if (first) {
                first = false;
            }
            else {
                result += '&';
            }
            result += key + '=' + escapeBinary(params[key]);
        }
    }
    return result;
}

function create(metaInfo){
    var announce = metaInfo.announce, parsedUrl = url.parse(announce), port = parsedUrl.port ? parsedUrl.port : 80;
    return {
        metaInfo: metaInfo,
        port: port,
        trackerRelativeUri: parsedUrl.pathname,
        host: parsedUrl.hostname,
        peers: {}
    };
}

// callback(exception, response, body)
// Handles redirects, coalescing response.

function httpRequestHelper(verb, host, port, path, headers, redirectLimit, callback){
    headers.host = host;
    var client = http.createClient(port, host), request = client.request(verb, path, headers);
    request.addListener('response', function(response){
        var statusCode = response.statusCode, body = '';
        if (statusCode == 200) {
            response.setEncoding('binary');
            response.addListener('error', function(error){
                callback(error, response, body);
            });
            response.addListener('end', function(){
                callback(null, response, body);
            });
            response.addListener('data', function(chunk){
                body += chunk;
            });
        }
        else 
            if (statusCode >= 300 && statusCode <= 399) {
                if (redirectLimit <= 0) {
                    callback('Too many redirects', response);
                }
                else {
                    sys.log('redirect ' + statusCode + ' ' + JSON.stringify(body));
                    httpRequestHelper(verb, host, port, path, headers, redirectLimit - 1, callback);
                }
            }
            else {
                callback('error', response, body);
            }
    });
    request.end();
}

// callback(error, {response})
function ping(trackerClient, params, callback){
    var path = trackerClient.trackerRelativeUri + '?' +
    queryStringify(params);
    sys.log('pinging tracker');
    httpRequestHelper('GET', trackerClient.host, trackerClient.port, path, {}, 10, function(error, response, body){
        var result = {};
        if (!error) {
            try {
                result = bencode.decode(body);
            } 
            catch (e) {
                error = e;
            }
        }
        callback(error, result);
    });
}

exports.create = create;
exports.ping = ping;
