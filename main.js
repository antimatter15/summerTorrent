var sys = require('sys'),
    torrent = require('./torrent');
    
String.prototype.toBinary = function() {
	var ret='';
	for(var i=0;i<this.length;i++){
		ret+=this.charCodeAt(i).toString(2);
	}
	return ret;
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

//here's antimatter15's implementation, i think they're better
//because at least it works with a fairly fundamental concept
//that binaryToString(stringToBinary(x)) == x;
//logically it does not work with unicodey things
function stringToBinary(bytes) {
    var i, b = [];
    for (i = 0; i < bytes.length; i++) {
        b[i] = bytes.charCodeAt(i) & 0xff;
    }
    return b.map(function(v){
      return v.toString(2)
    }).join('')/*.split('').map(function(v){
      return +v;
    });*/
};

function binaryToString(bytes){ //as a string
  if(bytes % 7) throw "poop";
  for(var ret = '',l = bytes.length, i = 0; i < l; i+= 7){
    ret += String.fromCharCode(parseInt(bytes.substr(i, 7),2))
  }
  return ret;
}

String.prototype.fromBinary = function() {
	var ret='';
	for(var i=0;i<this.length;i++){
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
