const path = require('path');
var contentdir = path.resolve();
var sl;
var DecompressZip = require('decompress-zip');

const {ipcRenderer} = require("electron");
//var ipcRenderer = require('electron').ipcRenderer;

            if (process.platform === 'linux') {
                sl = '/';
            } else if (process.platform === 'win32') {
                sl = '\\';
            }
            contentdir += sl;
            contentdir += 'content';

var tastidwld = document.getElementsByClassName("download-file");
var datatitle='';

for (var i=0; i < tastidwld.length; i++) {
  tastidwld[i].onclick = function(){
    var filemappa=[];
    // qui andrà messa una funzione che prende dati da xml o fetch files web
    /* filemappa.push({url:this.getAttribute("data-url")})
    filemappa.push({url:this.getAttribute("data-url2")})
    filemappa.push({url:this.getAttribute("data-url3")}) */
    datatitle=this.getAttribute("data-title");
    var dir=contentdir;
    var progressbar= document.getElementById("download-bar-progress");
    var progressdiv= document.getElementById("download-progress");
    var unzipbar= document.getElementById("unzip-bar-progress");
    var unzipdiv= document.getElementById("unzip-progress");
    var downloadbox= document.getElementById("downloadbox");
    var boxavaliable= document.getElementById("boxavaliable");

    ipcRenderer.send("download-single", {
      url: this.getAttribute("data-url"),
      properties: {directory: contentdir}
    });

    progressdiv.style.display = "block";
    downloadbox.style.display = "block";
    this.classList.add("download-file-active");
    this.innerHTML='In download';
    boxavaliable.style.pointerEvents = "none";

    ipcRenderer.send("download-multi", filemappa, dir);

    ipcRenderer.on("download-progress", (event, progressObj) => {
      const progressInPercentage=progressObj.progress * 100
      const cleanProgressPercentage=Math.round(progressInPercentage);
      progressbar.style.width=cleanProgressPercentage+'%';
      progressbar.innerHTML = cleanProgressPercentage+'%';
    });

    ipcRenderer.on("download-cancel", (event, item) => {
      console.log('cancel');
      alert('cancel');
    });

    ipcRenderer.on("download-finished", (event, item) => {
      notify_download();
      var unzipper = new DecompressZip(item)
      progressdiv.style.display = "none";
      unzipdiv.style.display = "block";
 
      unzipper.on('error', function (err) {
          console.log('Caught an error: '+err);
      });
       
      unzipper.on('extract', function (log) {
          console.log('Finished extracting');
          unzipdiv.style.display = "none";
          downloadbox.style.display = "none";  
          boxavaliable.style.pointerEvents = "all";
          // elimina il box dagli avaliables
          //@TODO aggiungi downloaded in xml content
          // rilancia contentxmlaudioguides
      });
       
      unzipper.on('progress', function (fileIndex, fileCount) {
        const progressUnzipPercentage=((fileIndex+1)/fileCount)*100
        const cleanUnzipPercentage=Math.round(progressUnzipPercentage);
        unzipbar.style.width=cleanUnzipPercentage+'%'
        unzipbar.innerHTML = 'Estratto file ' + (fileIndex + 1) + ' di ' + fileCount;
      });
       
      unzipper.extract({
          path: contentdir,
          filter: function (file) {
              return file.type !== "SymbolicLink";
          }
      });
    });
    
    //
    // TODO lancio funzione per prendere i riferimenti dell'XML (audioguide.xml) interno alla dir scaricata
    // prendo l'attuale content.xml e ci appendo alla fine i riferimenti presi
    // faccio un check per capire se tutte le directory sono mappate in content.xml
    // se non sono mappate, ricostruisco content.xml
    // infine lancio la funzione per ricostruire contenuti-scaricati. xml
    //createXmlAudioguide();
    //alert("scaricato in "+contentdir);
  }
};

function notify_download(){
  const notifier = require('node-notifier');
  const path = require('path'); // duplicato?

notifier.notify(
  {
    title: 'Download contenuti Hi-Storia',
    message: 'Hai scaricato contenuti su "'+datatitle+'". Estrazione contenuti in corso...',
    icon: path.join(__dirname, 'coulson.jpg'), // Absolute path (doesn't work on balloons)
    sound: false, // Only Notification Center or Windows Toasters
    wait: true // Wait with callback, until user action is taken against notification
  },
  function(err, response) {}
);
}

function checkAudioguideDir(){
  var fs2 = require('fs');
  var allAudioguides = [];

  var all = fs2.readdirSync(contentdir);
  all.map(file => {
    // am I a directory?
    if (fs2.statSync(`${contentdir}/${file}`).isDirectory()) {
        // recursively scan me for dir
        allAudioguides.push(`${file}`);
    }
  });
  console.dir(allAudioguides)
}

/*
 * da inserire nella funzione per creare il file
 * deve crearlo se non esiste, aggiungere se esiste
 * magari serve un ulteriore livello parent, non so
 * lang e level potrebbero essere pure separati singolarmente */

function createXmlAudioguide(){
  var fs2 = require('fs');
var builder = require('xmlbuilder'),
xml2 = builder.create('root', { encoding: 'utf-8' }),
audioguides = xml2.ele('audioguides'),
audioguide;
/*
_.each(list, function(element) {
  audioguide = audioguides.ele('audioguide');
  audioguide.ele('title', null, element.name);
  audioguide.ele('id', null, element.name);
  audioguide.ele('lang', null, element.name);
  audioguide.ele('level', null, element.price);
}); */
audioguide = audioguides.ele('audioguide');
audioguide.ele('id', null, 'b');
audioguide.ele('title', null, 'a');
audioguide.ele('lang', null, 'd');
audioguide.ele('level', null, 'dd');

xml2 = xml2.end({ pretty: true});
fs2.writeFile("content/content2.xml", xml2, (err) => {
  if (err) throw (err);
});

}

 /*
 function createXmlAudioguide(){
    var fs2 = require('fs'),
    xml2js2 = require('xml2js');
    var obj;
     obj = {
       content:
       {audioguide:
      {title: "Santa Maria a Mare",
      tracks: 7,
      id:"TESMMAR2017001IT0",
      parent:"TESMMAR2017",
      lang:"italiano",
      level:"per tutti"
    }}
      ,
      {audioguide:
      {title: "San Flaviano",
      tracks: 8,
      id:"TESNFLV2016001IT0",
      parent:"TESNFLV2016",
      lang:"italiano",
      level:"per tutti"}}
  };
var builder = new xml2js2.Builder();
var xml2 = builder.buildObject(obj);
fs2.writeFile("content/content.xml", xml2, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
});
}
*/