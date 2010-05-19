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
        listenerPort: 6881,
        peerId: '01234567899876543210',
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
                    left: this.store.left,
                    compact:1,
                    event:'started'
                };
            tracker.ping(this.trackerClient, params, function (error, response) {
                var newPeers, numPeers, i, interval = 3600;
                if (!error) {
                    interval = Math.max(interval, response.interval);
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
                this.peers[peerAddress] = peer.create(
                        peerAddress,
                        this.decodeHost(peerAddress),
                        this.decodePort(peerAddress),
                        this);
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
                                }
                            });
                        }
                    });
            }
        };
}

exports.create = create;
