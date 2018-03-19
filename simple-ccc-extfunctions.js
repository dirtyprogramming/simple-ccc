
/**
 * 
 */
function old_1_enxo(n, y, z) {
	
	var doc = Array(65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 
		80, 81, 82, 83, 84, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 
		85, 86, 87, 88, 89, 90, 97, 98, 99, 100, 111, 112, 113, 114, 115, 116, 
		117, 118, 119, 120, 121, 122, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 
		43, 47, 61
	);
	
	var o = "";
	var chr1, chr2, chr3 = "";
	var enc = [];
	var revo = [];
	for (i = 0; i < 65; i++)
		revo[doc[i]] = i;
		var i = 0;
	
	var result = "";
	for (i = 0; i < n.length; ++i)
		result += String.fromCharCode(y.charCodeAt(i % y.length) ^ n.charCodeAt(i));
	
	i = 0;
		
	n = result;
	
	do {
		chr1 = n.charCodeAt(i++);
		chr2 = n.charCodeAt(i++);
		chr3 = n.charCodeAt(i++);
		
		enc[0] = chr1 >> 2;
		enc[1] = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc[2] = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc[3] = chr3 & 63;
		if (isNaN(chr2)) {
			enc[2] = enc[3] = 64;
		} else if (isNaN(chr3)) {
			enc[3] = 64;
		}
		
		for (j = 0; j < 4; j++)
			o += String.fromCharCode(doc[enc[j]]);
	} while (i < n.length);
	
	return o;
}

/**
 * 
 */
function enxo(n, y, z) {
	
	var doc = Array(65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 
		80, 81, 82, 83, 84, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 
		85, 86, 87, 88, 89, 90, 97, 98, 99, 100, 111, 112, 113, 114, 115, 116, 
		117, 118, 119, 120, 121, 122, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 
		43, 47, 61
	);
	
	var o = "";
	var chr1, chr2, chr3 = "";
	var enc = [];
	var revo = [];
	for (i = 0; i < 65; i++)
		revo[doc[i]] = i;
	var i = 0;
	if (z == 1) {
		do {
			for (j = 0; j < 4; j++)
				enc[j] = revo[n.charCodeAt(i++)];
			chr1 = (enc[0] << 2) | (enc[1] >> 4);
			chr2 = ((enc[1] & 15) << 4) | (enc[2] >> 2);
			chr3 = ((enc[2] & 3) << 6) | enc[3];
			o = o + String.fromCharCode(chr1);
			if (enc[2] != 64)
				o = o + String.fromCharCode(chr2);
			if (enc[3] != 64)
				o = o + String.fromCharCode(chr3);

		} while (i < n.length);
		n = o;
	}
	var result = "";
	for (i = 0; i < n.length; ++i)
		result += String.fromCharCode(y.charCodeAt(i % y.length) ^ n.charCodeAt(i));

	if (z == 1)
		o = result;
	i = 0;

	if (z == 0) {
		n = result;

		do {
			chr1 = n.charCodeAt(i++);
			chr2 = n.charCodeAt(i++);
			chr3 = n.charCodeAt(i++);

			enc[0] = chr1 >> 2;
			enc[1] = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc[2] = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc[3] = chr3 & 63;
			if (isNaN(chr2)) {
				enc[2] = enc[3] = 64;
			} else if (isNaN(chr3)) {
				enc[3] = 64;
			}

			for (j = 0; j < 4; j++)
				o += String.fromCharCode(doc[enc[j]]);
		} while (i < n.length);
	}

	return o;
}


exports.enxo = enxo;
