const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const dialog = electron.dialog;
const ipc = electron.ipcMain;
const nativeImage = electron.nativeImage;

const path = require('path');
const url = require('url');
const { autoUpdater } = require('electron-updater');
const isDev = require('electron-is-dev');

autoUpdater.logger = require('electron-log');
autoUpdater.autoDownload = false;
autoUpdater.logger.transports.file.level = 'info';

const {download} = require('electron-dl');

let MainWin;
let ico = nativeImage.createFromPath(path.join(__dirname, 'logo.png'));
let usr_apd = false;

function createMainWindow() {
    autoUpdater.checkForUpdates();

    MainWin = new BrowserWindow({
        show: false,
        center: true,
        width: 800,
        height: 600,
        minWidth: 320,
        minHeight: 240,
        icon: ico
    });

    MainWin.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
    }));

    MainWin.on('ready-to-show', () => {
        MainWin.show();
    });

    MainWin.on('closed', () => {
        MainWin = null;
    });
    
    //Abilita il debugger interno di Chrominum.
    MainWin.webContents.openDevTools()

   MainWin.webContents.on('dom-ready', () => {
        MainWin.webContents.send('isloaded','');
    });

/*
    click: () => {
        usr_apd = true;
        autoUpdater.checkForUpdates();
    } */
}


autoUpdater.on('update-available', (info) => {
    // console.log('Update Available');
    // console.log('Version : ' + info.version);
    // console.log('Release Date : ' + info.releaseDate);

    dialog.showMessageBox(MainWin, {
        title: 'Updates',
        type: 'info',
        message: 'Update Available',
        detail: 'A new version has been found. Click on Update to Update',
        buttons: ['Update', 'Cancel']
    }, function (res) {
        if (res === 0) {
            autoUpdater.downloadUpdate();
        }
    });
});

autoUpdater.on('update-not-available', () => {
    if(usr_apd) {
        dialog.showMessageBox(MainWin, {
            title: 'Updates',
            type: 'info',
            message: 'Update Not Available',
            detail: 'Your App is Up-todate',
            buttons: ['OK']
        });
        usr_apd = false;
    }
});

autoUpdater.on('download-progress', (progress) => {
    MainWin.webContents.send('update-download', progress.percent);
});

autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox(MainWin, {
        title: 'Updates',
        type: 'info',
        message: 'Update Downloaded',
        detail: 'The Update has been downloaded. Click on Install to install',
        buttons: ['Update', 'Cancel']
    }, function (res) {
        if (res === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});

autoUpdater.on('error', (err) => {
    dialog.showMessageBox(MainWin, {
        title: 'Updates',
        type: 'info',
        message: 'Error',
        detail: err,
        buttons: ['Cancel']
    });
});

app.on('ready', () => {
    createMainWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (MainWin === null) {
        createWindow();
    }
});

// download 
ipc.on('download-single', (event, args) => {
    download(BrowserWindow.getFocusedWindow(), args.url,
        {
            directory:args.directory,
            onStarted: items => {
                event.sender.send("download-started");
                ipc.on('download-cancelled', (event) =>{
                    items.cancel();
                    return;
                });
                ipc.on('download-paused', (event) =>{
                    items.pause();
                    return;
                });
                ipc.on('download-resumed', (event) =>{
                    items.resume();
                    return;
                });
            },
            onProgress: progress => {
                event.sender.send("download-progress", { progress, args });
            },
            onCancel: itemc => {
                event.sender.send("download-cancel", { itemc, args });
            }
        })
        .then(dl => event.sender.send("download-finished", dl.getSavePath()))
      .catch(console.error);
  }) 


// download multiplo
/* 
ipc.on("download-multi", async (event, files, dir) => {
    const downloadLocation = dir;
  
    const promises = files.map(file =>
        download(BrowserWindow.getFocusedWindow(), file.url, {
            saveAs: false,
        directory: downloadLocation,
        onProgress: progress => {
          event.sender.send("download-progress", { progress, file });
        },
        onCancel: item => {
            event.sender.send("download-cancel", { item, file });
          }
      })
    );
  
    await Promise.all(promises);
  }); */