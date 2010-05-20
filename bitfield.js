var sys = require('sys'),
    sortedArray = require('./sortedArray');

/*
 * n: number of bits, b: optional byte string,
 */

exports.create = function (n, bytes) {
    var byteLen = (n + 7) >> 3,
        b = [];
    function stringToArray(bytes) {
        var i;
        if (bytes) {
            if (bytes.length != byteLen) {
                throw "bad bytes length.";
            }
            for (i = 0; i < byteLen; i++) {
                b[i] = bytes.charCodeAt(i) & 0xff;
            }
        } else {
            for (i = 0; i < byteLen; i++) {
                b[i] = 0;
            }
        }
    };
    stringToArray(bytes);
    return {
        set: function(index, val) {
            if (!(index >= 0 && index < n)) {
                throw "bad index " + index;
            }
            var i = index >> 3,
                m = 1 << ((~index) & 7),
                v = b[i];
            b[i] = v & (~m) | (val ? m : 0);
        },
        get: function(index, val) {
            if (!(index >= 0 && index < n)) {
                throw "bad index " + index;
            }
            var i = index >> 3,
                m = 1 << ((~index) & 7),
                v = b[i];
            return (v & m) != 0;
        },
        setWire: function (bytes) {
            stringToArray(bytes);
        },
        getWire: function() {
            var bytes = '', i;
            for (i = 0; i < byteLen; i++) {
                bytes += String.fromCharCode(b[i]);
            }
            return bytes;
        }
    };
};
