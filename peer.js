var net = require('net'),
    sys = require('sys');

function create(key, host, port, torrent) {
    sys.log('peer.create ' + host + ':' + port);
    var stream = net.createConnection(port, host),
        header = String.fromCharCode(19) + 'BitTorrent protocol',
        flagBytes = '\0\0\0\0\0\0\0\0',
        peer = {
            torrent: torrent,
            key: key,
            host: host,
            port: port,
            needHeader: true,
            input: '',
            stream: stream,
            checkHeader: function(text) {
                return (text.substring(0,20) === header
                        && text.substring(28,48) === this.torrent.metaInfo.info_hash);
            }
    };

    stream.setEncoding('binary');
    stream.addListener('connect', function() {
        var firstPacket = header + flagBytes
            + torrent.metaInfo.info_hash + torrent.peerId;
        sys.log("Connection established to " + host + ':' + port);
        stream.write(firstPacket, 'binary');
    });
    stream.setNoDelay();
    stream.addListener('error', function(e) {
        sys.log('peer error ' + host + ':' + port + ' ' + e);
        stream.end();
        torrent.removePeer(key);
    });
    stream.addListener('end', function() {
        sys.log('peer end ' + host + ':' + port + ' ');
        torrent.removePeer(key);
    });
    stream.addListener('data', function(data) {
        sys.log('got data from ' + host);
        peer.input += data;
        if (peer.needHeader) {
            if (peer.input.length >= 48) {
                if (peer.checkHeader(peer.input) ) {
                    peer.input = peer.input.substring(48);
                    peer.needHeader = false;
                    sys.log('Got valid header');
                } else {
                    sys.log('Got invalid header');
                    peer.drop();
                }
            }
        }
    });
    return peer;
}

exports.create = create;
