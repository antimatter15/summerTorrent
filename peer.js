var bitfield = require('./bitfield'),
    net = require('net'),
    sys = require('sys');

exports.create = function create(key, host, port, torrent) {
    sys.log('peer.create ' + host + ':' + port);
    var stream = net.createConnection(port, host),
        header = String.fromCharCode(19) + 'BitTorrent protocol',
        flagBytes = '\0\0\0\0\0\0\0\0',
        input = '',
        needHeader = true,
        goodPieces = bitfield.create(torrent.store.pieceCount),
        amInterested = false,
        amChoked = true,
        peerInterested = false,
        peerChoked = true,
        peer = {
            torrent: torrent,
            key: key,
            host: host,
            port: port,
            stream: stream,
            requests : [],
            isChoked: function() {
				return peerChoked;
			},
            getBitfield: function() {
				return goodPieces;
			},
			isInterested: function() {
				return peerInterested;
			},
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
		// Too verbose 
        //sys.log('got data from ' + host);

        function readInt(s, offset) {
            offset = offset || 0;
            if (s.length < offset + 4) {
                throw 'expected 4 bytes.';
            }
            return (s.charCodeAt(offset) << 24)
                | (s.charCodeAt(offset + 1) << 16)
                | (s.charCodeAt(offset + 2) << 8)
                | s.charCodeAt(offset + 3);
        }

        function doHave(data) {
            var piece = readInt(data);
            sys.log('have ' + piece);
            goodPieces.set(piece, true);
        }

        function doBitfield(data) {
            sys.log('bitfield');
            goodPieces.setWire(data);
        }

        function readRequest(data) {
            var index = readInt(data, 0),
            begin = readInt(data, 4),
            length = readInt(data, 8),
            pieceLength = torrent.store.pieceLength,
            pieceCount = torrent.store.pieceCount;
            if (! ((begin >= 0 && begin + length <= pieceLength)
                    && (length > 0 && length <= 32 * 1024)
                    && (index >= 0 && index < pieceCount)) ) {
                throw "request bad parameters";
            }
            return {index : index, begin : begin, length : length};
            sys.log('Peer requested piece '+index);
        }

        function requestEqual(a, b) {
            return a.index == b.index &&
                a.begin == b.begin &&
                a.length == b.length;
        }

        function doRequest(data) {
            var request = readRequest(data),
                requests = peer.requests,
                r, i, len = requests.length;
            for (i = 0; i < len; i += 1) {
                r = requests[i];
                if (requestEqual(r, request)) {
                    // duplicate request.
                    return;
                }
            }
            requests.push(request);
        }

        function doPiece(data) {
            var index = readInt(data, 0),
                begin = readInt(data, 4),
                block = data.substring(8),
                length = block.length,
                pieceLength = torrent.store.pieceLength,
                pieceCount = torrent.store.pieceCount;
            if (! ((begin >= 0 && begin + length <= pieceLength)
                    && (length > 0 && length <= 32 * 1024)
                    && (index >= 0 && index < pieceCount)) ) {
                    sys.log('oh crap bad piece params');
                throw "piece bad parameters";
            }
            //sys.log("received piece " + index +' ' + begin + ' ' + length); // Reduced verbosity
            filestore.writePiecePart(torrent.store, index, begin, block,
                    function(err) {
                        //sys.log('Wrote piece ' + index + (err||"NO ERRORS FTW!")); // Reduced verbosity.
                        
                        realPieceLength= (index==(pieceCount-1)) ? torrent.store.lastPieceLength : pieceLength;
                        
                        if(realPieceLength == (begin+block.length)){ //this screws up the last piece
							/* Todo:
							 * * Verification
							 */
                          sys.log('Wrote Piece #+'+index);
                          torrent.store.goodPieces.set(index, 1); //change bitfield
                          delete torrent.piecesQueue[index]; // Delete from the pieces Queue
                          
                          for(var i in torrent.peers){
							torrent.peers[i].have(index);
                          }
                        }
                        
                        
            });
        }

        function doCancel(data) {
            var request = readRequest(data),
            requests = peer.requests,
            r, i, len = requests.length;
            for (i = 0; i < len; i += 1) {
                r = requests[i];
                if (requestEqual(r, request)) {
                    request.splice(i, 1);
                    return;
                }
            }
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
                    // sys.log('Got valid header');
                    return true;
                } else {
                    throw 'Got invalid header';
                }
                return false;
            }
            if (input.length < 4) {
                return false;
            }
            dataLen = readInt(input);
            if (input.length < dataLen + 4) {
                return false;
            }
            if (dataLen == 0) {
                // Keep alive;
                sys.log(host + " Keep alive");
            } else {
                id = input.charCodeAt(4);
                payload = input.substring(5, 4 + dataLen);
                if (id == 0) {
                    // Choke
                    peerChoked = true;
                } else if (id == 1) {
                    // Unchoke
                    peerChoked = false;
                } else if (id == 2) {
                    // Interested
                    peerInterested = true;
                } else if (id == 3) {
                    // Not interested
                    peerInterested = false;
                } else if (id == 4) {
                    doHave(payload);
                } else if (id == 5) {
                    doBitfield(payload);
                } else if (id == 6) {
                    doRequest(payload);
                } else if (id == 7) {
                    doPiece(payload);
                } else if (id == 8) {
                    doCancel(payload);
                } else if (id == 9) {
                    sys.log(host + " DHT listen-port");
                } else {
                    // May want to silently ignore
                    throw 'Unknown request ' + id;
                }
            }
            input = input.substring(4 + dataLen);
            return true;

        };
        
        input += data;
        try {
            while (processMessage());
        } catch (e) {
            sys.log('exception thrown while processing messages ' + e);
            stream.end();
            torrent.removePeer(key);
        }
    });

    function encodeInt(i) {
        return String.fromCharCode(0xff & (i >> 24)) +
            String.fromCharCode(0xff & (i >> 16)) +
            String.fromCharCode(0xff & (i >> 8)) +
            String.fromCharCode(0xff & i);
    }

    function writePacket(op, payload) {

		try {
			if (op === 0) {
				//stream.write('\0\0\0\0', 'binary');
				stream.write(encodeInt(0), 'binary');
			} else {
				payload = payload || '';
				stream.write(encodeInt(payload.length + 1)
						+ String.fromCharCode(op) + payload,
						'binary');
			}

		} catch (err) {
			sys.log(err);
		}
    }
    peer.setChoke = function(state) {
        if (state != amChoked) {
            amChoked = state;
            writePacket(state ? 0 : 1);
        }
    };
    peer.setInterested = function(state) {
        if (state != amInterested) {
            amInterested = state;
            writePacket(state ? 2 : 3);
        }
    };
    peer.have = function(index) {
        writePacket(4, encodeInt(index));
    };
    peer.sendBitfield = function(){
        writePacket(5, torrent.store.goodPieces.getWire());
    };
    peer.sendRequest = function(index, begin, length) {
        writePacket(6, encodeInt(index) + encodeInt(begin) + encodeInt(length));
    };
    peer.sendPiece = function(index, begin, data) {
        writePacket(7, encodeInt(index) + encodeInt(begin) + data);
    };
    peer.sendCancel = function(index) {
        writePacket(8, encodeInt(index));
    };
    peer.sendKeepalive = function() {
		writePacket(0);
	}

    return peer;
};
