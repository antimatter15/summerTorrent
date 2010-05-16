var sys = require('sys'),
    fs = require('fs'),
	bencode = require('./bencode'),
	filestore = require('./filestore'),
	tracker = require("./tracker"),
    crypto = require('crypto');

function log(msg) {
	sys.puts(msg);
}

function pingTracker(metaInfo, store, trackerClient) {
	var params = {
		info_hash: metaInfo.info_hash,
		peer_id: '01234567890123456789',
		port: 6881,
		uploaded: 0,
		downloaded: 0,
		left: store.left,
		compact:1,
		event:'started'
	};
	tracker.ping(trackerClient, params, function (error, response) {
		system.log('pingTracker callback ' + error + ' ' + JSON.stringify(response));
	});
}

function computeHash(info) {
	var encoded = bencode.encode(info),
		hash = crypto.createHash('sha1');
	hash.update(encoded);
	return hash.digest('binary');
}

function startTorrent(torrentPath, destDir) {
	var metaInfo, store, error2, trackerClient;
	sys.puts('Starting torrent ' + torrentPath);
	fs.readFile(torrentPath, 'binary', function startTorrentCallback(error, contents) {
		var aFileStore;
		if (error) {
			log('Could not open torrent file ' + torrentPath + ': ' + error);
		} else {
			metaInfo = bencode.decode(contents);
			if ('comment' in metaInfo) {
				sys.puts('Torrent \'' + metaInfo.comment + '\'');					
			}
			metaInfo.info_hash = computeHash(metaInfo.info);
			store = filestore.create(metaInfo, destDir);
			sys.log('inspecting files');
			filestore.inspect(store,
				function inspectCallback(error) {
					if (error) {
						log('Could not inspect torrent files ' + error);
					} else {
						trackerClient = tracker.create(metaInfo);
						pingTracker(metaInfo, store, trackerClient);
					}
				});
		}
	});
}

exports.startTorrent = startTorrent;