var net = require('net'),
    peer = require('./peer'),
    sys = require('sys');


function create(port, hashes) {
    var state = 0, server = net.createServer(function(stream) {
        sys.log('createServer callback');
        stream.setEncoding('binary');
        stream.addListener('connect', function() {
            sys.log('New connection');
                // TODO: Tell tracker about this connection.
        });
        stream.addListener('data', function(data) {
            sys.log('Got data'+data);
            var pstrlen = data.charCodeAt(0);
            var pstr = data.substr(1, pstrlen);
            var reserved = data.substr(pstrlen + 1, 8);
            var info_hash = data.substr(pstrlen + 1 + 8, 20);
            var peer_id = data.substr(pstrlen + 1 + 8 + 20, 20);
            sys.log("PSTRLEN"+pstrlen+' pstr '+pstr+' info_hash '+info_hash+' peer_id '+peer_id);
                // TODO: Tell tracker about this connection.
        });
        stream.addListener('end', function() {
            sys.log('End connection');
                // TODO: Tell tracker about this connection.
        });
    });
    server.listen(port);
}

exports.create = create;
