exports.encode = function encode(s) {
	var type = typeof s;
	if (type === 'number') {
		return 'i' + s + 'e';
	} else if (type === 'string') {
		return s.length + ':' + s;
	} else if (type === 'object') {
		if (s) {
			if (s instanceof Array) {
				var result = 'l';
				for (var i = 0, sLen = s.length; i < sLen; i++) {
					result += encode(s[i]);
				}
				return result + 'e';
			} else {
				var result = 'd';
				for(var prop in s) {
				    if(s.hasOwnProperty(prop)) {
				        result += encode(prop) + encode(s[prop]);
					}
				}
				return result + 'e';
			}
		}
		throw "unexpected null";
	} else {
		throw "unexpected type " + type;
	}
}

function checkedIndexOf(s, c) {
	var result = s.indexOf(c);
	if (result < 0) {
		throw "expected a " + c;
	}
	return result;
}

function decode2(s) {
	if ('string' !== typeof s || s.length < 1) {
		throw "expected a non-empty string";
	}
	var c = s.charAt(0);
	if (c === 'i') {
		s = s.substring(1);
		var e = checkedIndexOf(s, 'e');
		return [parseInt(s.substring(0, e), 10), s.substring(e+1)];
	} else if (c >= '0' && c <= '9') {
		e = checkedIndexOf(s, ':');
		var len = parseInt(s.substring(0, e), 10);
		var startOfString = e + 1;
		var endOfString = startOfString + len;
		return [s.substring(startOfString, endOfString), s.substring(endOfString)];
	} else if (c == 'l') {
		s = s.substring(1);
		var a = [];
		while ( true ) {
			if (s.length == 0) {
				throw "end of input while looking for 'e'";
			}
			if (s.charAt(0) == 'e') {
				return [a, s.substring(1)];
			} else {
				var s2 = decode2(s);
				a.push(s2[0]);
				s = s2[1];
			}
		} 
	} else if (c == 'd') {
		s = s.substring(1);
		var a = {};
		while ( true ) {
			if (s.length == 0) {
				throw "end of input while looking for 'e'";
			}
			if (s.charAt(0) == 'e') {
				return [a, s.substring(1)];
			} else {
				var s2 = decode2(s);
				var k = s2[0];
				s = s2[1];
				s2 = decode2(s);
				a[k] = s2[0];
				s = s2[1];
			}
		} 
	} else {
		throw "unexpected character " + c;
	}
}

exports.decode2 = decode2;

exports.decode = function decode(s) {
	var result = decode2(s);
	var leftOver = result[1];
	if (leftOver !== '') {
		throw "'characters left over at end of decode: '" + leftOver + "'";
	}
	return result[0];
}
