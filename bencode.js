exports.encode = function encode(s) {
    var type = typeof s, result, i, sLen, prop, props;
    if (type === 'number') {
        return 'i' + s + 'e';
    } else if (type === 'string') {
        return s.length + ':' + s;
    } else if (type === 'object') {
        if (s) {
            if (s instanceof Array) {
                result = 'l';
                for (i = 0, sLen = s.length; i < sLen; i += 1) {
                    result += encode(s[i]);
                }
                return result + 'e';
            } else {
                result = 'd';
                props = [];
                for (prop in s) {
                    if (s.hasOwnProperty(prop)) {
                        props.push(prop);
                    }
                }
                props.sort();
                for (i = 0, sLen = props.length; i < sLen; i += 1) {
                    prop = props[i];
                    result += encode(prop) + encode(s[prop]);
                }
                return result + 'e';
            }
        }
        throw "unexpected null";
    } else {
        throw "unexpected type " + type;
    }
};

function checkedIndexOf(s, c) {
    var result = s.indexOf(c);
    if (result < 0) {
        throw "expected a " + c;
    }
    return result;
}

function decodeInt(s) {
    s = s.substring(1);
    var e = checkedIndexOf(s, 'e');
    return [parseInt(s.substring(0, e), 10), s.substring(e + 1)];
}

function decodeString(s) {
    var e = checkedIndexOf(s, ':'),
        len = parseInt(s.substring(0, e), 10),
        startOfString = e + 1,
        endOfString = startOfString + len;
    return [s.substring(startOfString, endOfString), s.substring(endOfString)];
}

// Predeclaration to make jslint happy.
var decode2;

function decodeList(s) {
    s = s.substring(1);
    var a = [], s2;
    while (true) {
        if (s.length === 0) {
            throw "end of input while looking for 'e'";
        }
        if (s.charAt(0) === 'e') {
            return [a, s.substring(1)];
        } else {
            s2 = decode2(s);
            a.push(s2[0]);
            s = s2[1];
        }
    }
}

function decodeDictionary(s) {
    s = s.substring(1);
    var a = {}, s2, k;
    while (true) {
        if (s.length === 0) {
            throw "end of input while looking for 'e'";
        }
        if (s.charAt(0) === 'e') {
            return [a, s.substring(1)];
        } else {
            s2 = decode2(s);
            k = s2[0];
            s = s2[1];
            s2 = decode2(s);
            a[k] = s2[0];
            s = s2[1];
        }
    }
}

function decode2(s) {
    if ('string' !== typeof s || s.length < 1) {
        throw "expected a non-empty string";
    }
    var c = s.charAt(0);
    if (c === 'i') {
        return decodeInt(s);
    } else if (c >= '0' && c <= '9') {
        return decodeString(s);
    } else if (c === 'l') {
        return decodeList(s);
    } else if (c === 'd') {
        return decodeDictionary(s);
    } else {
        throw "unexpected character " + c;
    }
}

exports.decode2 = decode2;

exports.decode = function decode(s) {
    var result = decode2(s),
        leftOver = result[1];
    if (leftOver !== '') {
        throw "'characters left over at end of decode: '" + leftOver + "'";
    }
    return result[0];
};
