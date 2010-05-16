var sys = require('sys');
var assert = require('assert');
var bencode = require('../bencode');

// Test bencode

function assertSame(a, b) {
    var sa = JSON.stringify(a),
        sb = JSON.stringify(b);
    sys.puts(sa + ' === ' + sb);
    assert.ok(sa === sb);
}

function testBencode() {
    var cases = [
        // Integers
        ['i0e', 0], ['i1e', 1], ['i10e', 10], ['i-10e', -10],
        // Strings
        ['0:', ''], ['1:a', 'a'], ['10:abcdefghij', 'abcdefghij'],
        // Arrays
        ['le', []], ['li0ei1ee', [0, 1]], ['l4:spami42ee', ['spam', 42]],
        // Dictionaries
        ['de', {}], ['d3:bar4:spam3:fooi42ee', {'bar': 'spam', 'foo': 42}]
    ], i, casesLen, aCase, encoded, decoded, benDecoded, benEncoded;
    for (i = 0, casesLen = cases.length; i < casesLen; i = i + 1) {
        aCase = cases[i];
        encoded = aCase[0];
        decoded = aCase[1];
        benDecoded = bencode.decode(encoded);
        benEncoded = bencode.encode(decoded);
        assertSame(encoded, benEncoded);
        assertSame(decoded, benDecoded);
    }
}

function tests() {
    try {
        testBencode();
    } catch (myError) {
        sys.puts("Exception: " + JSON.stringify(myError));
        throw myError;
    }
}

tests();