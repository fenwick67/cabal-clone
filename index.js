const {app, BrowserWindow} = require('electron');

let win

function createWindow(){
	win = new BrowserWindow({});
	win.loadFile('desktop/index.html');
}

app.on('ready', createWindow)
