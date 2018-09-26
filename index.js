const {app, BrowserWindow} = require('electron');

let win

function createWindow(){
	win = new BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar : true,
		darkTheme:true,
		vibrancy:"dark"
	});
	win.loadFile('desktop/index.html');
}

app.on('ready', createWindow)
