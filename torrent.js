var sys = require('sys'),
    fs = require('fs'),
	bencode = require('./bencode'),
	filestore = require('./filestore'),
	tracker = require("./tracker");

function log(msg) {
	sys.puts(msg);
}

function pingTracker(metaInfo, store, trackerClient) {
	tracker.ping(trackerClient, {}, function (error, response) {
		system.log('pingTracker callback ' + error + ' ' + JSON.stringify(response));
	});
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
			store = filestore.create(metaInfo, destDir);
			sys.log('inspecting files');
			filestore.inspect(store,
				function inspectCallback(error) {
					if (error) {
						log('Could not inspect torrent files ' + error);
					} else {
						log('goodPieces: ' + store.goodPieces);
						trackerClient = tracker.create(metaInfo);
						pingTracker(metaInfo, store, trackerClient);
					}
				});
		}
	});
}

exports.startTorrent = startTorrent;