
/**
 * 
 * @param	{String}	rawdata 	A string that contains a users list
 */
function parseRawuserslist(rawdata) {
	var res = new Array();
	unparsedData = rawdata.split('#');
	unparsedData.shift(0);
	unparsedData.pop(0);
	
	for(var i=0;i<unparsedData.length;i++) {
		res.push([unparsedData[i].substring(8, 14), unparsedData[i].substring(17)]);
	}
	
	return res;
}

/**
 * 
 * @param	{String}	rawdata 	A string that contains a rooms list
 */
function parseRawroomslist(rawdata) {
	var res = new Array();
	unparsedData = rawdata.substr(13).split('$')[0].split('#');
	unparsedData.pop(0);
	
	for(var i=0;i<unparsedData.length;i++) {
		res.push([(200 + i), unparsedData[i]]);
	}
	
	return res;
}

/**
 * 
 * @param	{String}	rawdata 	A string that contains a messages list
 */
function fetchMessages(rawdata) {
	var messages = new Array();
	// Removing JS stuff (function name, parenthesis, quote...)
	if(rawdata.indexOf('process1') == 0)
		rawdata = rawdata.split('\'')[1];
	// Removing codes announcing messages + '#' char
	if( rawdata.indexOf('#669') == 0 || rawdata.indexOf('@669') == 0 || rawdata.indexOf('#970') == 0 ) // private message
		rawdata = rawdata.substr(4);
	if(rawdata.indexOf('#95') == 0) // in room message
		rawdata = rawdata.substr(3);
	
	var arr_rawdata = rawdata.split('#');
	if(!arr_rawdata[arr_rawdata.length - 1])
		arr_rawdata.pop(); // last array element may be an empty string
	
	var skip_next = false; // Since message text is isolated we'd just skip it
	var tmp_userID, tmp_userSignature, tmp_messageText;
	for(var i=0;i<arr_rawdata.length;i++) {
		if(skip_next) {
			skip_next = false;
			continue;
		}
		
		if(!isNaN(arr_rawdata[i]) && arr_rawdata[i].length == 6) {
			/* a single 6-digits (userID); user is typing */
		}
		// TODO: Set a regex instead for the next test...?!
		if(arr_rawdata[i].length > 14 && !isNaN(arr_rawdata[i].substr(0, 14))) {
			/* first 14 characters are digits; user signature */
			tmp_userID = arr_rawdata[i].substr(8, 6);
			tmp_userSignature = arr_rawdata[i].substr(0); // 14 digits + 3 digits + username
			tmp_messageText = arr_rawdata[i+1]; // Message comes after signature
			messages.push({'userID': tmp_userID, 'userSignature': tmp_userSignature, 'messageText': tmp_messageText});
			skip_next = true;
		}
	}
	
	return(messages);
}

exports.parseRawuserslist = parseRawuserslist;
exports.parseRawroomslist = parseRawroomslist;
exports.fetchMessages = fetchMessages;
