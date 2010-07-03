var bencode = require('./bencode'),
    crypto = require('crypto');
    filestore = require('./filestore'),
    fs = require('fs'),
    listener = require('./listener'),
    peer = require('./peer'),
    sys = require('sys'),
    tracker = require("./tracker");

function create(torrentPath, destDir) {
    return {
        torrentPath: torrentPath,
        destDir: destDir,
        listenerPort: 6882,
        peerId: ('-JS0001-'+Math.random().toString(36).substr(3)
                       +Math.random().toString(36).substr(3)).substr(0, 20),
        peers: {},
        store: {},
        metaInfo: {},
        pingTracker: function () {
            var that = this,
                params = {
                    info_hash: this.metaInfo.info_hash,
                    peer_id: this.peerId,
                    port: this.listenerPort,
                    uploaded: 0,
                    downloaded: 0,
                    numwant: 50,
                    left: this.store.left,
                    compact:1,
                    event:'started'
                };
            tracker.ping(this.trackerClient, params, function (error, response) {
                var newPeers, numPeers, i, interval = 3600;
                if (!error) {
                    interval = Math.max(interval, response.interval);
                    sys.puts(JSON.stringify(response))
                    newPeers = response.peers;
                    
                    numPeers = Math.floor(newPeers.length / 6);
                    sys.log('Tracker gave us ' + numPeers + ' peers.');
                    for (i = 0; i < numPeers; i++ ) {
                        that.addPeer(newPeers.substring(i*6,(i+1)*6));
                    }
                }
                that.pingTimer = setTimeout(function () {
                        that.pingTracker();
                    }, interval * 1000);
            });
        },

        addPeer : function (peerAddress) {
            if ( ! (peerAddress in this.peers) ) {
                try {
                    this.peers[peerAddress] = peer.create(
                            peerAddress,
                            this.decodeHost(peerAddress),
                            this.decodePort(peerAddress),
                            this);
                } catch (e) {
                    sys.log('Exception while creating peer ' + e);
                }
            }
        },

        removePeer: function (peerAddress) {
            var peer = this.peers[peerAddress];
            if (peer) {
                sys.log('Removing peer ' + peer.host);
                delete this.peers[peerAddress];
            }
        },

        computeHash: function (info) {
            var encoded = bencode.encode(info),
                hash = crypto.createHash('sha1');
            hash.update(encoded);
            return hash.digest('binary');
        },

        decodeHost: function (address) {
            return address.charCodeAt(0) + '.' + address.charCodeAt(1) + '.' + address.charCodeAt(2) + '.' + address.charCodeAt(3);
        },

        decodePort: function (address) {
            return (address.charCodeAt(4) << 8) + address.charCodeAt(5);
        },

        start : function() {
            var that = this;
            sys.puts('Starting torrent ' + this.torrentPath);
            fs.readFile(this.torrentPath, 'binary',
                    function startTorrentCallback(error, contents) {
                        if (error) {
                            sys.log('Could not open torrent file ' + that.torrentPath + ': ' + error);
                        } else {
                            that.metaInfo = bencode.decode(contents);
                            if ('comment' in that.metaInfo) {
                                sys.log('Torrent \'' + that.metaInfo.comment + '\'');
                            }
                            that.metaInfo.info_hash = that.computeHash(that.metaInfo.info);
                            that.store = filestore.create(that.metaInfo, that.destDir);
                            sys.log('inspecting files');
                            filestore.inspect(that.store,
                                    function inspectCallback(error) {
                                if (error) {
                                    sys.log('Could not inspect torrent files ' + error);
                                } else {
                                    sys.log('finished inspecting files.');
                                    listener.create(that.listenerPort, [that.metaInfo.info_hash]);
                                    that.trackerClient = tracker.create(that.metaInfo);
                                    that.pingTracker();
                                    
                                    setInterval(function() {

											//hey why not do a totally unoptimized super duper crappy whatnot
											var pieces = {
											  //piece_index: number_of_peers_have_it
											};
											for(var i in that.peers) { //iterate through peers,
											  that.peers[i].getBitfield().getBitArray().forEach(function(v, i){ //loop through their bitfield
											    pieces[i] = (pieces[i] || 0) + (+v); //add it to a map of pieces (since zero = dont have, 1 = have, adding works)
											  })
											}
											var pieces_array = []; 
											that.store.goodPieces.getBitArray().forEach(function(v, i){ //loop through my bitfield
											  if(v == 0){
											    //sys.log('piece index: '+i+' == i no haz');
											    pieces_array.push(i); //if I don't have it, then add the index to pieces array
										    }else{
											    //sys.log('piece index: '+i+' == i haz');
										    }
											});
											
											var completion = 1-(pieces_array.length/that.store.pieceCount)
											
											sys.log("Torrent at "+(Math.floor(completion * 100 * 100)/100)+"% completion (total pieces: "+that.store.pieceCount+')');
											
											pieces_array.sort(function(a, b){
											  return pieces[a] - pieces[b]; //sort the pieces that I don't have by the number of people who have it
											});
											
											//pieces array now contains a list of pieces where 0 = rarest (and if there's only one peer, then it's sorted numerically)
											//sys.log('Pieces sorted by availability (rarest first). '+pieces_array.join(', '));
											
											[pieces_array[0]].forEach(function(val, index) {
												for(i in that.peers) {
													if(that.peers[i].getBitfield().getBitArray()[val]) {
														that.peers[i].setInterested(true);
														
														for(start=0;start<that.store.pieceLength;start+=Math.pow(2,15)) {
															that.peers[i].sendRequest(val, start, ((start+Math.pow(2,15)) <= that.store.pieceLength ? Math.pow(2,15) : that.store.pieceLength-start));
															sys.log('requesting ('+val+', '+start+', '+((start+Math.pow(2,15)) <= that.store.pieceLength ? Math.pow(2,15) : that.store.pieceLength-start)+')');
														}
														
														sys.log('requested for part '+val);
														break;
													}
												}
											});
											
										},
									5000);
                                    
                                }
                            });
                        }
                    });
            }
        };
}

exports.create = create;
