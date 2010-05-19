var net = require('net'),
    sys = require('sys');

function create(host, port) {
    sys.log('peer.create ' + host + ':' + port);
    var peer = {
            host: host,
            port: port,
            exchangedHeader: false,
            stream: net.createConnection(port, host),
            connect: function() {
                sys.log("Connection established to " + this.host + ':' + this.port);
                this.stream.write('\x13BitTorrent protocol\0\0\0\0\0\0\0\0');
            }
    };

    peer.stream.setEncoding('binary');
    sys.log('peer.create 3 ' + host + ':' + port);
    peer.stream.addListener('connect', function() {
        sys.log('peer.stream connect ' + host + ':' + port);
        peer.connect();
    });
    peer.stream.addListener('error', function(e) {
        sys.log('peer.stream error ' + host + ':' + port + ' ' + e);
    })
    sys.log('peer.create 4 ' + host + ':' + port);
    return peer;
}

exports.create = create;
