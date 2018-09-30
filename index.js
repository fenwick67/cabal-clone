const {app, BrowserWindow} = require('electron');

let win

function createWindow(){
	win = new BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar : true,
		darkTheme:true,
		vibrancy:"dark",
		icon:"desktop/icon.png"
	});
	win.loadFile('desktop/index.html');
	win.on('closed', () => {
    win = null;
		setTimeout(f=>{
			process.exit(0);
		},500);
  })
}

app.on('ready', createWindow)
