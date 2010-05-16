
// Return the index into which you should insert the value to maintain the array
// in sorted order. Could be in range -1 .. array.length

function bsearch(array, value) {
	var a = -1, c = array.length, b, v;
	while (a + 1 < c) {
		b = ((a + c) >> 1);
		v = array[b];
		if (v < value) {
			a = b;
		} else {
			c = b;
		}
	}
	return c;
}

function badd(barray, item) {
    var index = bsearch(barray, item);
    barray.splice(index, 0, item);
}

function bremove(barray, item) {
    var index = bsearch(barray, item);
    barray.splice(index, 1);
}

exports.add = badd;
exports.remove = bremove;