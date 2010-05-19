var net = require('net'),
    sys = require('sys');

function create(key, host, port, torrent) {
    sys.log('peer.create ' + host + ':' + port);
    var stream = net.createConnection(port, host),
        header = String.fromCharCode(19) + 'BitTorrent protocol',
        flagBytes = '\0\0\0\0\0\0\0\0',
        input = '',
        needHeader = true,
        peer = {
            torrent: torrent,
            key: key,
            host: host,
            port: port,
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

        function readBigEndianInt(s) {
            return (s.charCodeAt(0) << 24)
                | (s.charCodeAt(1) << 16)
                | (s.charCodeAt(2) << 8)
                | s.charCodeAt(3);
        }

        // returns true if a message was processed
        function processMessage() {
            var dataLen, id;
            if (needHeader) {
                if (input.length < 68) {
                    return false;
                }
                if (peer.checkHeader(input) ) {
                    peer.peerId = input.substring(48, 68);
                    input = input.substring(68);
                    needHeader = false;
                    sys.log('Got valid header');
                    return true;
                } else {
                    sys.log('Got invalid header');
                    peer.drop();
                }
                return false;
            }
            if (input.length < 4) {
                return false;
            }
            dataLen = readBigEndianInt(input);
            if (input.length < dataLen + 4) {
                return false;
            }
            if (dataLen == 0) {
                // Keep alive;
                sys.log(host + " Keep alive");
            } else {
                id = input.charCodeAt(4);
                if (id == 0) {
                    sys.log(host + " choke");
                } else if (id == 1) {
                    sys.log(host + " unchoke");
                } else if (id == 2) {
                    sys.log(host + " interested");
                } else if (id == 3) {
                    sys.log(host + " not interested");
                } else if (id == 4) {
                    sys.log(host + " have");
                } else if (id == 5) {
                    sys.log(host + " bitfield");
                } else if (id == 6) {
                    sys.log(host + " request");
                } else if (id == 7) {
                    sys.log(host + " piece");
                } else if (id == 8) {
                    sys.log(host + " cancel");
                } else if (id == 9) {
                    sys.log(host + " DHT listen-port");
                } else {
                    sys.log(host + " Unknown request " + id);
                }
            }
            input = input.substring(4 + dataLen);
            return true;

        };
        input += data;
        while (processMessage());
    });
    return peer;
}

exports.create = create;
