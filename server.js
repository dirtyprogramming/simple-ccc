var express 	= require('express');
var app 		= express();
var http 		= require('http').Server(app);
var sio 		= require('socket.io')(http);

var ccc 		= require('./simple-ccc-backend.js');

var lastUser 	= {}; // Used to store last user connection details

app.use(express.static(__dirname +'/public'));


sio.sockets.on('connection', function(socket) {
	console.log('New client:'+ socket.id +'\n|+> Last user data:\n|-> userID: \t'+ lastUser.userID +'\n|-> userPass: \t'+ lastUser.userPass);
	
	/*  */
	var myInterval = setInterval(function() {
		if(socket.userID && socket.userPass) {
			ccc.checkUpdates(socket, function(err, res) {
				if(err) {
					socket.emit('log_error', { serverError: err, messageError: 'Impossible de consulter les mises à jour.' });
					console.log(err);
				}
				
			});
		}
	}, 3500);
	
	
	socket.on('update_userdata', function(data) {
		console.log('- - -\nClient>', 'userdata update:', data);
		socket.username = data['username'];
		socket.userSex = data['userSex'];
		socket.userAge = data['userAge'];
		socket.userID = data['userID'];
		socket.userPass = data['pass'];
		
		if(socket.username && socket.username.length > 3 && !socket.userID && !socket.userPass) {
			console.log('Initializing connection...');
			ccc.initConnection(socket, function(err, res) {
				if(err) {
					socket.emit('log_error', { serverError: err, messageError: 'Connexion impossible' });
					console.log('Error:', err)
				}
				else {
					console.log('Connected.');
					lastUser.userID = res[0];
					lastUser.userPass = res[1];
				}
			});
		}
		
	});
	
	socket.on('update_userslist', function(data) {
		console.log('Client>', 'userslist update...');
		ccc.getUserslist(socket, function(err, res) {
			if(err) {
				socket.emit('log_error', { serverError: err, messageError: 'Impossible d\'obtenir une liste d\'utilisateurs.' });
				console.log(err);
			}
			else
				socket.emit('updated_userslist', res);
		});
	});
	
	socket.on('update_roomslist', function(data) {
		console.log('Client>', 'roomslist update...');
		ccc.getRoomslist(socket, function(err, res) {
			if(err) {
				socket.emit('log_error', { serverError: err, messageError: 'Impossible d\'obtenir une liste de rooms.' });
				console.log(err);
			}
			else
				socket.emit('updated_roomslist', res);
		});
	});
	socket.on('room_join', function(roomID) {
		console.log('Client>', 'join room', roomID);
		ccc.joinRoom(socket, roomID, function(err, res) {
			if(err) {
				socket.emit('log_error', { serverError: err, messageError: 'Impossible de rejoindre la room '+ roomID });
				console.log(err);
			}
			else
				socket.emit('room_joined', {'roomID': res});
		});
	});
	
	socket.on('send_message', function(data) {
		console.log('Client>', 'sending message...');
		ccc.sendMessage(socket, data, function(err, res) {
			if(err)
				socket.emit('log_error', {serverError: err, messageError: 'Impossible d\'envoyer le message (<i>'+ data['messageText'] +'</i>) à '+ data['recipientID']});
			else
				console.log(res);
		});
	});
	socket.on('send_image', function(data) {
		console.log('Client>', 'image uploading:', data);
		ccc.uploadImage(socket, data, function(err, res) {
			if(err)
				socket.emit('log_error', {serverError: err, messageError: 'Impossible d\'envoyer l\'image.'});
		});
	});
	socket.on('send_typing', function(data) {
		console.log('Client>', 'message typing:');
		ccc.sendTyping(socket, data, function(err, res) {
			if(err)
				console.log(err);
		});
	});
	
});

http.listen(8080, function() {
	console.log('App is listening on port 8080');
});

exports.http = http;
