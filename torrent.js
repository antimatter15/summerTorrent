var sys = require('sys');

function startTorrent(torrentPath) {
	sys.puts('Starting torrent ' + torrentPath);
}

exports.startTorrent = startTorrent;