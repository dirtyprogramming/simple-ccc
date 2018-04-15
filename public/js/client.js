var socket = null;
socket = io.connect('localhost:8080');

socket.on('updated_userslist', set_userslist);
socket.on('updated_roomslist', set_roomslist);
socket.on('received_messages', set_receivedMessages);
socket.on('received_roomMessages', set_received_roomMessages);
socket.on('uploaded_sentImage', function(data) { sendMessage(true, {'recipientID': data.recipientID, 'messageText': data.messageText}); });
socket.on('sent_message', function(data) { tab_addMessage({'userID': data['recipientID'], 'messageText': data['messageText']}, {owner: true, messageState:data['messageState']}); });
socket.on('loggedin', set_loggedin);
socket.on('room_joined', set_roomjoined);

socket.on('log_error', set_log);

/**
 * Sends user data to client-server for update / inits login process
 */
function update_userdata() {
	var username = document.getElementById('public_myusername').value;
	var userSex = document.getElementById('private_userSex_2').checked ? '2' : '1'
	var userAge = document.getElementById('public_userAge').value;
	var userID = document.getElementById('private_userID').value;
	var pass = document.getElementById('private_pass').value;
	var code = document.getElementById('private_code').value;
	socket.emit('update_userdata', {username, userSex, userAge, userID, pass, code});
}
/**
 * Stores generated user data provided by coco server
 * @param	{Array}		data	User private data (userID,  pass)
 */
function set_loggedin(data) {
	document.getElementById('private_userID').value = data['userID'];
	document.getElementById('private_pass').value = data['pass'];
	document.getElementById('private_code').value = data['code'];
	update_userslist();
	update_roomslist();
	document.getElementById('bt_login').disabled = true;
}

/**
 * Called when a room has been successfuly joined and displays it name
 * @param	{Object}	data	An object that contains joined room ID
 */
function set_roomjoined(data) {
	var currRoomPlaceholder = document.getElementById('rooms').getElementsByTagName('p')[0];
	var roomName = document.getElementById('rooms_list').options[data['roomID'] - 200].text
	currRoomPlaceholder.innerHTML = 'Salon courant : '+ roomName;
	//tab_addMessage({'messageText': '- - - '+ roomName +' - - -', 'userSignature':'000000000000', 'userID': '999999', 'messageState':'sent' }, {'owner':true, 'inroom':true});
}

/**
 * Asks client-server a current connected users list
 */
function update_userslist() {
	socket.emit('update_userslist');
}
/**
 * Updates users list &lt;select&gt; with a new one
 * @param	{Array}		userlist	A list of users (userID, username)
 */
function set_userslist(userslist) {
	var domElement_usersList = document.getElementById('users_list');
	domElement_usersList.innerHTML = '';
	for(var i=0;i<userslist.length;i++) {
		domElement_usersList.options[domElement_usersList.options.length] = new Option(userslist[i][1], userslist[i][0]);
	}
}

/**
 * Asks client-server a current available rooms list
 */
function update_roomslist() {
	socket.emit('update_roomslist');
}

/**
 * Updates rooms list &lt;select&gt; with a new one
 * @param	{Array}		roomslist	A list of rooms name
 */
function set_roomslist(roomslist) {
	var domElement_roomslist = document.getElementById('rooms_list');
	domElement_roomslist.innerHTML = '';
	for(var i=0;i<roomslist.length;i++)
		domElement_roomslist.options[domElement_roomslist.options.length] = new Option(roomslist[i][1], roomslist[i][0]);
}

/**
 * Sends a request to join selected room
 */
function room_join() {
	var roomID = document.getElementById('rooms_list').selectedOptions[0].value;
	socket.emit('room_join', roomID);
}

/**
 * Sends a typing notification
 */
function sendTyping() {
	var recipientID = getCurrentUserTabId();
	if(recipientID != '000000' && recipientID != '999999') {
		if(document.getElementById('messagetext').value.length == 2)
			socket.emit('send_typing', recipientID);
	}
}

/**
 * Sends a message to a user
 * @param	{Boolean}	inchat		Indicates which recipientID to use
 * @param	{Object}	overwrite	Contains message fields to overwrite
 */
function sendMessage(inchat, overwrite) {
	var messageText = '';
	var recipientID = 0;
	if(inchat) {
		
		if(overwrite && overwrite.recipientID)
			recipientID = overwrite.recipientID;
		else
			recipientID = getCurrentUserTabId();
		
		if(overwrite && overwrite.messageText)
			messageText = overwrite.messageText;
		else
			messageText = document.getElementById('messagetext').value;
		
		if(messageText.indexOf('_!') != 0) // Not an image
			messageText = formatText4coco(messageText);
		
		if(!overwrite)
			document.getElementById('messagetext').value = '';
	}
	else {
		recipientID = document.getElementById('users_list').selectedOptions[0].value
		messageText = formatText4coco(document.getElementById('message2send').value);
		document.getElementById('message2send').value = '';
	}
	if(messageText.length)
		socket.emit('send_message', {recipientID, messageText});
}

/**
 * Uploads an image file to server and sends it to a user
 * @param	{Object}	overwrite
 */
function sendImage(overwrite) {
	var recipientID = getCurrentUserTabId();
	var file2upload = null;
	if(overwrite && overwrite.file)
		file2upload = overwrite.file
	else
		file2upload = document.getElementById('file2send').files[0].path;
	document.getElementById('file2send').value = '';
	socket.emit('send_image', {'recipientID': recipientID, 'file': file2upload});
	
}

/**
 * Manages and displays tabs and related received messages
 * Note: tabs and msg windows creation process is separated since a user could
 * remove a messages-window, so we just remove concerned tab but we leave
 * the messages-window hidden so we can preserve chat history if recientID
 * reconnects or just sends another message.
 * @param	{Object}	messages	An object that contains message(s)
 */
function set_receivedMessages(messages, inroom) {
	if(!document.hasFocus()) {
		if(document.title.indexOf('+') != -1) {
			tmp_prevCount = parseInt(document.title.substr(document.title.indexOf('+') + 1));
			document.title = 'Simple CcC +' + (tmp_prevCount + messages.length);
		}
		else
			document.title = 'Simple CcC +' + messages.length;
	}
	for(var i=0;i<messages.length;i++) {
		// working on tab
		if(!document.getElementById('targetWindow_'+ messages[i]['userID']))
			tab_create(messages[i]);
		
		// Working on msg window
		if(!document.getElementById('window_'+ messages[i]['userID']))
			tab_createWindow(messages[i]);
		
		// Working on notifications
		tmp_domElTab4current = document.getElementById('targetWindow_'+ messages[i]['userID']);
		if(tmp_domElTab4current.className.indexOf('activetablink') == -1 && tmp_domElTab4current.className.indexOf('notiftablink') == -1)
			tmp_domElTab4current.className += ' notiftablink';
		
		// Working on message text
		tab_addMessage(messages[i], {'owner': false, 'inroom': inroom});
		
	}
}

/**
 * Prepares in room messages for displaying
 * @param	{Array}		messages	An array that contains inroom message(s)
 */
function set_received_roomMessages(messages) {
	for(var i=0;i<messages.length;i++) {
		messages[i]['userID'] = '999999';
	}
	set_receivedMessages(messages, true);
}


/***
 ** charCode => new char(s) to set
 */
var formatCharacters = {'32': '_', '33': '!', '34': '*8', '36': '*7', 
	'37': '*g', '39': '*8', '40': '(', '41': ')', '42': '*s', '61': '*h', 
	'63': '=', '64': '*m', '94': '*l', '95': '*0', '164': '_', '224': '*a', 
	'226': '*k', '231': '*c', '232': '*e', '233': '*r', '234': '*b', 
	'238': '*i', '239': '*j', '244': '*o', '249': '*f', '251': '*u'
};

/**
 * Formats a string according to Coco's requirements
 * @param	{string}	txt			String to format
 * @return	{string}	newText		Formatted given string
 */
function formatText4coco(txt) {
	var newText = '';
	for(var i=0;i<txt.length;i++) {
		currCharCode = txt.charCodeAt(i);
		if( currCharCode<43 || 
				(currCharCode > 59 && currCharCode < 65) || 
				(currCharCode > 90 && currCharCode < 96) || 
				(currCharCode > 122) ) {
			if(formatCharacters.hasOwnProperty(currCharCode))
				newText += formatCharacters[currCharCode];
			else
				newText += '';
		}
		else {
			newText += txt.charAt(i);
		}
	}
	return(newText);
}

/**
 * Unformats a Coco formatted string
 * @param	{string}	txt			String to unformat
 * @return	{string}	newText		Unformatted given string
 */
function unformatTextOfCoco(txt) {
	var newText = txt;
	var charCodes4formatted = Object.keys(formatCharacters);
	
	if(txt.indexOf('_!') == 0) { // Image filename
		newText = '<span>'+ txt.substr(txt.indexOf('_!') + 3) +'<br />';
		newText += '<img src="http://pix1.coco.fr/upload/'+ txt.substr(txt.indexOf('~_') + 4) +'" width="100px" />';
		newText += '</span>';
	}
	else {
		for(var i=0;i<charCodes4formatted.length;i++) {
			if(newText.indexOf(formatCharacters[charCodes4formatted[i]]) != -1) {
				newText = newText.split(formatCharacters[charCodes4formatted[i]]).join(String.fromCharCode(charCodes4formatted[i]));
			}
		}
	}
	
	return(newText);
}


/**
 * Removes given tab id
 * This function doesn't remove msgwindow, it just hides it, in order to preserve sent and received messages
 * for a further chat with that user.
 * It also displays closest tab upon tab deletion.
 * @param	{String}	id		tab recipientID
 */
function tab_remove(id) {
	var targetTab = document.getElementById('targetWindow_'+ id);
	
	// Prevent parent onclick event to fire up
	var e = window.event;
	if(e) {
		e.cancelBubbles = true;
		if(e.stopPropagation)
			e.stopPropagation();
	}
	
	if(targetTab) {
		
		// Display closest tab only if the removed one is activated
		if(id == getCurrentUserTabId()) {
			// TODO: Improve that part by switching to previous tab if right doesn't exist
			// Check if a tab exists next to the one we're removing.
			if(targetTab.nextSibling) {
				displayWindow( targetTab.nextSibling.id.substr(-6) );
			}
		}
		
		document.getElementById('tabs').removeChild(targetTab);
		document.getElementById('window_'+ id).style.display = 'none';
	}
}

/**
 * Creates a simple tab
 * @param	{Object}	data	Contains userID, username...
 */
function tab_create(data) {
	tmp_divEl4tab = document.createElement('div');
	tmp_divEl4tab.id = 'targetWindow_'+ data['userID'];
	tmp_divEl4tab.className = 'tablink';
	tmp_divEl4tab.title = data['userSignature'].substr(17);
	tmp_divEl4tab.setAttribute('onclick', 'displayWindow("'+ data['userID'] +'");');
	
	tmp_divEl4mgmt = document.createElement('div');
	tmp_divEl4mgmt.className = 'tabmgmt';
	tmp_divEl4mgmt.title = 'Fermer';
	tmp_divEl4mgmt.innerHTML = 'X';
	tmp_divEl4mgmt.setAttribute('onclick', 'tab_remove("'+ data['userID'] +'");');
	
	tmp_divEl4name = document.createElement('div');
	tmp_divEl4name.className = 'tabname';
	if(document.getElementById('params_tabsDisplayName').checked)
		tmp_divEl4name.innerHTML = data['userSignature'].substr(17);
	else
		tmp_divEl4name.innerHTML = data['userID'];
	
	tmp_divEl4tab.appendChild(tmp_divEl4mgmt);
	tmp_divEl4tab.appendChild(tmp_divEl4name);
	
	document.getElementById('tabs').appendChild(tmp_divEl4tab);
}

/**
 * Creates the msg window that contains messages
 * @param	{Object}	data	Contains userID, username...
 */
function tab_createWindow(data) {
	var userAge = data['userSignature'].substr(0, 2);
	var userSex = data['userSignature'].substr(2, 1);
	
	tmp_divEl4messages = document.createElement('div');
	tmp_divEl4messages.id = 'window_'+ data['userID'];
	tmp_divEl4messages.className = 'msgwindow';
	
	tmp_divEl4header = document.createElement('div');
	tmp_divEl4header.className = 'tabheader';
	tmp_divEl4header.innerHTML = '<h3>'+ data['userID'] +'</h3>';
	tmp_divEl4header.innerHTML += '<span>'+ userSex +' - '+ userAge +'</span>';
	
	tmp_divEl4messages.appendChild(tmp_divEl4header);
	
	document.getElementById('messages').insertBefore(tmp_divEl4messages, document.getElementById('messagesfooter'));
}

/**
 * Adds a message to a msg window
 * @param	{Object}	data	A single message object
 * @param	{Object}	options	Basic metadata about message
 */
function tab_addMessage(data, options) {
	var targetWindow = document.getElementById('window_'+ data['userID']);
	
	var currDate = new Date();
	
	tmp_pEl = document.createElement('p');
	tmp_pEl.title = currDate.getHours() +':'+ currDate.getMinutes() +':'+ currDate.getSeconds();
	if(options && options.owner) {
		if(options.messageState) {
			if(options.messageState == 'sent')
				tmp_pEl.className = 'msg_sent';
			else
				tmp_pEl.className = 'msg_error';
			}
		else
			tmp_pEl.className = 'msg_sent';
	}
	else {
		tmp_pEl.className = 'msg_received';
		tmp_pEl.setAttribute('ondblclick', "handler_messageDblclick(this)");
	}
	
	if(options && options.inroom) {
		tmp_pEl.innerHTML = data['userSignature'].substr(17) +'&gt; ';
		tmp_pEl.innerHTML += unformatTextOfCoco(data['messageText'].substr(1));
		tmp_pEl.title += ' / '+ data['userSignature'].substr(0, 2) +' ans (ID: '+ data['userSignature'].substr(8, 6) +')';
	}
	else
		tmp_pEl.innerHTML = unformatTextOfCoco(data['messageText']);
	
	// TODO: Create msgwindow if message is sent to a user from userslist
	if(targetWindow)
		targetWindow.appendChild(tmp_pEl);
	
	// Scrolling
	if(targetWindow)
		targetWindow.scrollTop = targetWindow.scrollHeight;
}

/**
 * Sets a msgwindow display style to 'block' to display messages it contains
 * @param	{String}	id		A msgwindow id => recipientID (number)
 */
function displayWindow(id) {
	var allMsgwindows = document.getElementById('messages').childNodes;
	for(var i=0;i<allMsgwindows.length;i++) {
		if(allMsgwindows[i].tagName == 'DIV' && allMsgwindows[i].className == 'msgwindow') {
			allMsgwindows[i].style.display = 'none';
			tmp_concernedTab = document.getElementById('targetWindow_'+ allMsgwindows[i].id.substr(7));
			if(tmp_concernedTab) { // A msgwindow can exist without its tablink (see tab_remove)
				if(tmp_concernedTab.className.indexOf('notiftablink') != -1)
					tmp_concernedTab.className = 'tablink notiftablink';
				else
					tmp_concernedTab.className = 'tablink';
			}
		}
	}
	document.getElementById('window_'+ id).style.display = 'block';
	document.getElementById('targetWindow_'+ id).className = ' tablink activetablink';
	document.getElementById('messagetext').focus();
}

/**
 * Handler for double clicking received messages
 * It creates a msgwindow with double-clicked message user, if that msgwindow and its tab
 * exist then it displays that msgwindow.
 * @param	{Object}	el		A DOM element
 */
function handler_messageDblclick(e) {
	// Remove selection from double click
	if(window.getSelection) {
		var sel = window.getSelection();
		sel.removeAllRanges();
	}
	
	if(getCurrentUserTabId() == '999999') {
		var rawData = e.title.substr(e.title.indexOf('/') + 2);
		var data = {'userID': rawData.substr(12, 6), 'userSignature': rawData.substr(0, 2) +'000000'+ rawData.substr(12, 6) +'000'+ e.innerHTML.substr(0, e.innerHTML.indexOf('&gt;'))};
		
		if(!document.getElementById('targetWindow_'+ data['userID']))
			tab_create(data);
		else
			displayWindow(data['userID']);
		
		if(!document.getElementById('window_'+ data['userID']))
			tab_createWindow(data);
	}
}

/**
 * Returns id (recipientID) of current displayed msgwindow
 * @Return	{Sttring}	currID		A msgwindow id => recipientID (number)
 */
function getCurrentUserTabId() {
	var currID = 0;
	var allMsgwindows = document.getElementById('messages').childNodes;
	for(var i=0;i<allMsgwindows.length;i++) {
		if(allMsgwindows[i].tagName == 'DIV' && allMsgwindows[i].className == 'msgwindow' && allMsgwindows[i].style.display == 'block')
			currID = allMsgwindows[i].id.substr(allMsgwindows[i].id.indexOf('_') + 1);
	}
	return currID;
}

/**
 * 
 * @param	{Object}	data	
 */
function set_log(data) {
	var currDate = new Date();
	var logPlaceholder = document.getElementById('log').getElementsByTagName('p')[0];
	logPlaceholder.innerHTML = '|- Serveur : '+ data['serverError'] +'<br />|- Message : '+ unformatTextOfCoco(data['messageError']);
	logPlaceholder.innerHTML += '<br />|-> '+ currDate.getHours() +':'+ currDate.getMinutes() +':'+ currDate.getSeconds();
	
}

/**
 * Deals with images dropped over msgwindow
 * @param	{Object}	e			A JS Event object
 */
function messages_ondrop(e) {
	e.stopPropagation();
	e.preventDefault();
	dropzone.style.backgroundColor = '#FFFFFF';
	
	var files = e.dataTransfer.files;
	if(files[0].path) {
		for(var i=0;i<files.length;i++)
			sendImage({'file': files[i].path});
	}
	
}

/**
 *
 */
function getRandomCode() {
	var code = '';
	for(var i=0;i<6;i++) {
		code += (Math.floor(Math.random() * 2)) ? Math.floor(Math.random() * 10) : String.fromCharCode(Math.floor(Math.random() * 26 ) + 97);
	}
	
	return(code);
}