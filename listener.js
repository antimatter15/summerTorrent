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
    });
    server.listen(port);
}

exports.create = create;
