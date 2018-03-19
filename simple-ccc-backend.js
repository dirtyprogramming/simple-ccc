var fs 				= require('fs');
var request 		= require('request');
var myparser 		= require('./simple-ccc-parser.js');
var extfunctions 	= require('./simple-ccc-extfunctions.js');

var BASE_URL 		= 'http://149.202.31.179/';

/**
 * Determines what to do upon received data from server
 * @param	{Object}	socket		A user connected socket
 * @param	{String}	data		A response data returned by server
 */
function ccRooter(socket, data) {
	var USERSIGNATURE_MIN_LENGTH = 17;
	
	if(data.indexOf('\(\'#Z\'\)') == -1) {
		var messages = null;
		// Case: message(s) received
		if( (data.indexOf('process1\(\'#669') == 0) || // Private message
			(data.indexOf('@669') != -1) || // Private message while in a room
		 	(data.indexOf('#970') != -1) // Private message while sending one
		){
			var index4messages = data.indexOf('#669') != -1 ? data.indexOf('#669') : data.indexOf('@669');
			index4messages = index4messages != -1 ? index4messages : data.indexOf('#970');
			messages = myparser.fetchMessages(data.substr(index4messages));
			if(messages.length) {
				socket.emit('received_messages', messages);
			}
		}
		
		// Case: in room message(s) received
		if(data.indexOf('process1\(\'#95') == 0) {
			index4messages = data.indexOf('#95');
			messages = myparser.fetchMessages(data.substr(index4messages));
			if(messages.length) {
				console.log('In room messages (a):');
				console.log(messages);
				socket.emit('received_roomMessages', messages);
			}
		}
		// Case: in room message(s) received while receiving room connected users
		if( data.indexOf('|&|') != -1 && (data.indexOf('@669') - data.indexOf('|&|')) > USERSIGNATURE_MIN_LENGTH ) {
			inroomMessagesOffset = data.indexOf('@669') - data.indexOf('|&|') - 3 // TODO: Something's wrong here (see messages)
			messages = myparser.fetchMessages( '#95'+ data.substr(data.indexOf('|&|') + 3, inroomMessagesOffset) );
			if(messages.length) {
				console.log('In room messages (b):');
				console.log(messages);
				socket.emit('received_roomMessages', messages);
			}
		}
	}
}

/**
 * Checks server for updates (received messages...)
 * @param	{Object}	socket		A user connected socket with userID and userPass
 */
function checkUpdates(socket, cb) {
	var url = BASE_URL +'95'+ socket.userID + socket.userPass;
	url += '?'+ Math.random();
	request(url, function(err, res, data) {
		if(!err && res.statusCode == 200) {
			ccRooter(socket, data);
			return cb(null, data);
		}
		else
			return cb('Error. Could not reach '+ url +' for updates.', null);
	});
}

/**
 * Requests server for a new current connected users list
 * @param	{Object}	socket		A user connected socket with userID and userPass
 */
function getUserslist(socket, cb) {
	var url = BASE_URL +'10'+ socket.userID + socket.userPass +'00';
	request(url, function(err, res, data) {
		if(!err && res.statusCode == 200) {
			var userslist = myparser.parseRawuserslist(data);
			return cb(null, userslist);
		}
		else
			return cb('Error. Could not reach '+ url +' for userslist update...', null);
	});
}

/**
 * Requests server for a new available rooms list
 * @param	{Object}	socket		A user connected socket with userID and userPass
 */
function getRoomslist(socket, cb) {
	var url = BASE_URL +'89'+ socket.userID + socket.userPass;
	
	request(url, function(err, res, data) {
		if(!err && res.statusCode == 200) {
			
			if(data.indexOf('process1\(\'#87') == 0 || data.indexOf('process1\(\'#89') == 0) {
				var roomslist = myparser.parseRawroomslist(data);
				return cb(null, roomslist);
			}
			else {
				return cb('Error. Could not retrieve a valid rooms name list. Returned data:'+ data.toString(), null);
			}
		}
		else
			return('Error. Could not reach '+ url +' for roomslist update...', null);
	});
}
/**
 * 
 */
function joinRoom(socket, roomID, cb) {
	var url = BASE_URL +'92'+ socket.userID + socket.userPass + roomID;
	request(url, function(err, res, data) {
		if(!err && res.statusCode == 200) {
			if(data.indexOf('process1\(\'#19'+ roomID) == 0)
				return cb(null, roomID);
			else
				return cb(data, null);
		}
		else
			return cb('Error. Could not reach '+ url +' to join room'+ roomID, null);
	});
}

/**
 * Sends a message to a connected user
 * @param	{Object}	socket		A user connected socket
 * @param	{Object}	data		An object with a recipientID and a message text
 */
function sendMessage(socket, data, cb) {
	var url = BASE_URL;
	if(data.recipientID == '999999') // recipient is a room
		url += '85'+ socket.userID + socket.userPass + data['recipientID'] +'R'+ data['messageText'];
	else
		url += '99'+ socket.userID + socket.userPass + data['recipientID'] +'0'+ data['messageText'];
	
	request(url, function(err, res, body) {
		if(!err && res.statusCode == 200) {
			
			// See if private message has been sent
			if(data['recipientID'] != '999999') {
				if(body.indexOf('process1\(\'#970') == 0)
					socket.emit('sent_message', {recipientID: data['recipientID'], messageText: data['messageText'], messageState: 'sent'});
				else {
					socket.emit('sent_message', {recipientID: data['recipientID'], messageText: data['messageText'], messageState: 'error'});
					return cb(body, null);
				}
			}
			
			ccRooter(socket, body);
		}
		else
			return cb('Error. Could not reach '+ url +' to send a message...', null);
	});
}


/**
 * Notifies server that a message is being typed
 * @param	{Object}	socket	A user connected socket
 * @param	{String}	data	A recipientID to notify
 */
function sendTyping(socket, data, cb) {
	var url = BASE_URL +'75';
	url += socket.userID + socket.userPass + data;
	
	request(url, function(err, res, body) {
		if(!err && res.statusCode == 200) {
			ccRooter(socket, body);
		}
		else
			return cb('Error. Could not reach '+ url +' to send typing...');
	});
	
}


/**
 * Uploads an image to server and returns its according data back to client for sending it as a message
 * @param	{Object}	socket		A user connected socket
 * @param	{Object}	data		An object with a recipientID and file to send
 */
function uploadImage(socket, data, cb) {
	if(data['recipientID'] && data['file'] && socket.username) {
		var uploadURL = 'http://pix.coco.fr/upload.php?bonid='+ data['recipientID'] +'&pseudo='+ socket.username;
		var formData = formData = { 'userfile': fs.createReadStream(data['file']) };
		
		request.post({'url': uploadURL, 'formData': formData}, function(err, res, body) {
			if(!err && res.statusCode == 200) {
				tmp_rmtFilename = body.substr(body.indexOf('*') + 1, body.lastIndexOf('\'') - body.indexOf('*') - 1);
				tmp_imageMessage = '_!1';
				tmp_imageMessage += tmp_rmtFilename;
				console.log('|-> Image uploaded:', tmp_rmtFilename);
				socket.emit('uploaded_sentImage', {'recipientID': data.recipientID, 'messageText': tmp_imageMessage});
			}
			else
				return cb('Could not reach '+ uploadURL +' for file upload.', null);
		});
	}
}


/**
 * Initializes and logs in user
 * @param	{Object}	socket		A user socket with a username at least
 */
function initConnection(socket, cb) {
	var payload = {
		'username': socket.username, 
		'age': socket.userAge, 
		'sex': socket.userSex, 
		'longpostalcode': '30925', 
		'myavatar': Math.floor(Math.random() * 964249067) + 164249067, // 9 random digits
		'speco': '0', 
		'random4param': Math.random() * 10000000, // random digits {7, 9}
	};
	
	var preConnectionURL = BASE_URL +'40'+ payload['username'] +'*'+ payload['age'] + payload['sex'];
	preConnectionURL += payload['longpostalcode'] + payload['myavatar'] + payload['speco'] + 'WKPEVEAZSEQTVPNNZFCL' +'?';
	preConnectionURL += payload['random4param'];
	
	request(preConnectionURL, function(err, res, data) {
		if(!err && res.statusCode == 200) {
			// Fetching ID and pass
			var rawUserData = data.split('#')[1].substr(2, 12);
			var userData = [rawUserData.substr(0, 6), rawUserData.substr(6)];
			
			var setConnectionURL = BASE_URL +'52'+ userData[0] + userData[1];
			var str2encr = '3551366743*0*q86exb*-2118897394*0*0';
			var encrStr = extfunctions.enxo(str2encr, userData[1], 0);
			setConnectionURL += encrStr;
			
			request(setConnectionURL, function(err, res, data) {
				if(!err && res.statusCode == 200) {
					socket.userID = userData[0];
					socket.userPass = userData[1];
					socket.emit('loggedin', {'userID': userData[0], 'pass': userData[1]});
					return cb(null, userData);
				}
				else
					return cb('Error. setConnection process has failed!', null);
			});
			
		}
		else
			return cb('Error. preConnection process has failed!', null);
	});
	
}


/* *** *** *** */
exports.checkUpdates = checkUpdates;
exports.getUserslist = getUserslist;
exports.getRoomslist = getRoomslist;
exports.joinRoom = joinRoom;
exports.sendTyping = sendTyping;
exports.sendMessage = sendMessage;
exports.uploadImage = uploadImage;
exports.initConnection = initConnection;
