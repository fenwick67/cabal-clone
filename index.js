const {app, BrowserWindow, ipcMain} = require('electron');

let win

function createWindow(){
	win = new BrowserWindow({
		width: 800,
		height: 600,
		minWidth:400,
		minHeight:300,
		autoHideMenuBar : true,
		darkTheme:true,
		vibrancy:"dark",
		frame:false,
		icon:"desktop/icon.png",
		title:"Cabal Clone"
	});
	win.loadFile('desktop/index.html');

	win.on('closed', () => {
    win = null;
		setTimeout(f=>{
			process.exit(0);
		},500);
  });

	ipcMain.on('maximize',event=>{
		win.isMaximized()?win.unmaximize():win.maximize();
	});

	ipcMain.on('minimize',event=>{
		win.minimize();
	});
}

app.on('ready', createWindow)
