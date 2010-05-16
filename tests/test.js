var sys = require('sys');
var assert = require('assert');
var bencode = require('../bencode');
var parseUri = require('../vendors/stevenlevithan/parseUri');
var sortedArray = require('../sortedArray');

// Test bencode

function assertSame(a, b) {
    var sa = JSON.stringify(a),
        sb = JSON.stringify(b);
    // sys.puts(sa + ' === ' + sb);
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

function testParseUri() {
	var cases = [ ['http://torrent.ubuntu.com:6969/announce']], i, casesLen, aCase, uri;
    for (i = 0, casesLen = cases.length; i < casesLen; i = i + 1) {
        aCase = cases[i];
		uri = aCase[0];
		sys.log(uri + ' returns ' + JSON.stringify(parseUri.parseUri(uri)));
	}
}

function testSortedArray() {
    var a = [];
    assertSame(a, []);
    sortedArray.add(a, 0);
    assertSame(a, [0]);
    sortedArray.add(a, 2);
    assertSame(a, [0, 2]);
    sortedArray.add(a, 4);
    assertSame(a, [0, 2, 4]);
    sortedArray.add(a, -1);
    assertSame(a, [-1, 0, 2, 4]);
    sortedArray.add(a, 1);
    assertSame(a, [-1, 0, 1, 2, 4]);
    sortedArray.add(a, 3);
    assertSame(a, [-1, 0, 1, 2, 3, 4]);
    sortedArray.add(a, 5);
    assertSame(a, [-1, 0, 1, 2, 3, 4, 5]);
    sortedArray.remove(a, 5);
    assertSame(a, [-1, 0, 1, 2, 3, 4]);
    sortedArray.remove(a, 3);
    assertSame(a, [-1, 0, 1, 2, 4]);
    sortedArray.remove(a, -1);
    assertSame(a, [0, 1, 2, 4]);
}

function tests() {
    try {
        testBencode();
		// testParseUri();
		testSortedArray();
    } catch (myError) {
        sys.puts("Exception: " + JSON.stringify(myError));
        throw myError;
    }
}

tests();