var sys = require('sys'),
    torrent = require('./torrent');
    
String.prototype.toBinary = function() {
	ret='';
	for(i=0;i<this.length;i++){
		ret+=this.charCodeAt(i).toString(2);
	}
	return ret;
}

String.prototype.fromBinary = function() {
	ret='';
	for(i=0;i<this.length;i++){
		ret+=String.fromCharCode(parseInt(this.charAt(i)));
	}
	return ret;
}

function parseArgs(args) {
    var result = {destDir:'.'},
        torrentFiles = [],
        i, argLen, arg;
    for (i = 0, argLen = args.length; i < argLen; i += 1) {
        arg = args[i];
        if (arg.length == 0) {
            throw "Empty argument";
        }
        if (arg.charAt(0) == '-') {
            if (arg === '--destDir') {
                result.destDir = args[i+1];
                i += 1;
            } else {
                throw "Unknown flag " + arg;
            }
        } else {
            torrentFiles.push(arg);
        }
    }
    result.files = torrentFiles;
    return result;
}

function main() {
    var args = parseArgs(process.argv.slice(2)),
        torrentFiles = args.files,
        i, iLen, file, aTorrent;
    if (torrentFiles.length == 0) {
        throw "No torrent files specified.";
    } else {
        for (i = 0, iLen = torrentFiles.length; i < iLen; i += 1) {
            file = torrentFiles[i];
            aTorrent = torrent.create(file, args.destDir);
            aTorrent.start();
        }
    }
}

main();
