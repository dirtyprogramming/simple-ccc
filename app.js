const {app, Menu, BrowserWindow} = require('electron');


var server = require('./server');

require('electron-context-menu')();

const menuTemplate = [
	{'label': 'Fichier', 
		submenu: [
			{'type': 'separator'}, 
			{'label': 'Quitter', 'role': 'close', 'accelerator': ''}
		]
	}, 
	{'label': 'Onglets', 
		submenu: [
			{'label': 'Fermer l\'onglet courant' }, 
			{'label': 'Fermer tous les onglets'}
		]
	}, 
	{'label': 'Aide', 
		submenu: [
			{'label': 'Developer Tools', click(item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.toggleDevTools() }}, 
		]
	}
		
];
const mainMenu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(mainMenu);

let win;

function createWindow() {
	win = new BrowserWindow({
		'width': 835, 
		'height': 560, 
		'minWidth': 300, 
		'minHeight': 300
	});
	
	win.loadURL('http://localhost:8080');
	
	win.on('closed', () => {
		win = null;
		server.http.close();
		server = null;
		process.exit(1);
	});
}

app.on('ready', createWindow);
