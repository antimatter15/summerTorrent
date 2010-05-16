var sys = require('sys'),
    fs = require('fs'),
	bencode = require('./bencode'),
	filestore = require('./filestore');

function log(msg) {
	sys.puts(msg);
}

function startTorrent(torrentPath, destDir) {
	var metaInfo, store, error2;
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
					}
				});
		}
	});
}

exports.startTorrent = startTorrent;