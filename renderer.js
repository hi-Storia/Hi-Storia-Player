const electron = require('electron');

const ipc = electron.ipcRenderer;
const {ipcRenderer} = require("electron");
const fs = require('fs');

var volume_slider;
var volume_current;
var progress;
var current;
var current_play;
var current_audioguide; // aggiunta
var current_audioguide_player; // aggiunta
var org_name; // aggiunta
var song_duration;
var seek_pos;
var index_song = []; // aggiunta
var pl_pa;
var next;
var prev;
var vol;
var song_list; //@TODO cambiato in var

var global_volume;
var prev_vol = global_volume;
var global_loc;
var current_song;

var curren_index;
var playList = []
var sl;

const path = require('path');
var sameaudioguide=0;

// variabili xml
    xml2js = require('xml2js');
    var parser = new xml2js.Parser();
var parserContent = new xml2js.Parser();
var listatracce = [];
var listaaudioguide = [];
var xmlaudioguides;
// fine variabili xml

const settings = require('electron-settings') // per salvare i dati in local storage
var tastiload = document.getElementsByClassName('load-file');

var is_connected;
var port_now=0;

// vado nelle variabili locali del browser e prendo l'ultima audioguida attiva; altrimenti metto quella di default
if(settings.get('defaultAudioguideLangId')){ settings.set('defaultAudioguideLangId', 'IT') }
if(settings.get('defaultAudioguideLevelId')){ settings.set('defaultAudioguideLevelId', '0')}
if(settings.get('activeAudioguideId')){ var audioguidaid = settings.get('activeAudioguideId');
}else{ var audioguidaid = 'TESNFLV2016001'} // @TODO: nella pagina impostazioni impostare l'audioguida preferita
 // @TODO: nella pagina impostazioni impostare lingua e livello preferito
var activeAudioguideLangId='IT';
var activeAudioguideLevelId='0'
//var audioguidadir = audioguidaid+settings.get('defaultAudioguideLangId')+settings.get('defaultAudioguideLevelId')
var audioguidadir = audioguidaid+activeAudioguideLangId+activeAudioguideLevelId;
var contentdir;
var tastiload=[];

// select
var selectLevel=document.getElementById('selectLevel')
var selectLang=document.getElementById('selectLang')

// controllo online
const isOnline = require('is-online');
const isReachable = require('is-reachable');

function checkOnline(){
    var is_online_offline = document.getElementById("is-online-offline"); // contenitore delle audioguide disponibili ma non scaricate
    var upgrade_connect_button= document.getElementById("upgrade-connect")
    isOnline().then(online => {
        var contenutiscaricabili = document.getElementsByClassName('contenuti-scaricabili-box');
        if(online){
            is_online_offline.innerHTML='Sei online';
            is_online_offline.classList.remove("is-offline");
            is_online_offline.classList.add("is-online");
            contenutiscaricabili = document.getElementsByClassName('contenuti-scaricabili-box');
            for(var r = 0; r < contenutiscaricabili.length; r++){
                contenutiscaricabili[r].classList.remove("contenuti-scaricabili-offline"); 
            }
            upgrade_connect_button.style.display = "none";
                // inserire dentro if online true?
            // perché la prima volta dà false??? fare più tentativi ed al 5o annullare
            isReachable('hi-storia.it').then(reachable => {
                console.log("Server: "+reachable);
                if(reachable){
            // sei online, ma il nostro database web sulla piattaforma di Hi-Storia non è raggiungibile da questo PC. Contatta un amministratore di rete per abilitare l'accesso a www.hi-storia.it, oppure riprova a connetterti più tardi
            // invia un ticket
                }
                //=> true
            });
        }else{
            is_online_offline.innerHTML='Sei offline';
            is_online_offline.classList.remove("is-online");
            is_online_offline.classList.add("is-offline"); 
            contenutiscaricabili = document.getElementsByClassName('contenuti-scaricabili-box');
            for(var r = 0; r < contenutiscaricabili.length; r++){
                contenutiscaricabili[r].classList.add("contenuti-scaricabili-offline"); 
            }
            upgrade_connect_button.style.display = "block";
        }
        //=> true
        upgrade_connect_button.onclick = function(){
            location.reload()
        }
    });
}

ipc.on('isloaded', () => { // listener dell'evento dichiarato nel main: quando il dom è caricato, attivo le funzioni che agiscono su di esso
    caricaTracce();
    caricaXml()
    loadUI();
    loadAudioguides();
 })

function loadAudioguides(){
    loadingboxIn();
    var contenutiscaricati = document.getElementById("contenuti-scaricati-div");
    var boxavaliable = document.getElementById("boxavaliable"); // contenitore delle audioguide disponibili ma non scaricate
    contenutiscaricati.innerHTML='';
    boxavaliable.innerHTML='';
    var contentdirxml = path.resolve() + sl + "content"; 

    checkOnline();

    fs.readFile(contentdirxml + sl +'content.xml', function(err, data) {
        parserContent.parseString(data, function (err, result) {
            xmlaudioguides=result;
            var xmlcontents = result['root']['audioguides'][0]['audioguide']
            if(xmlcontents){
                for (var i=0; i < xmlcontents.length; i++) {
                    if(result['root']['audioguides'][0]['audioguide'][i]['downloaded']>0){
                        // la lista delle audioguide scaricate
                        listaaudioguide.push(result['root']['audioguides'][0]['audioguide'][i]['id']);
                    }
                    var subId=result['root']['audioguides'][0]['audioguide'][i]['tipo'][0]['id'] // qui facciamo il controllo se c'è un default per lingua e target
                    // se non c'è, utiliziamo come primary id il primo dichiarato in xml
                    var audioguidanew= '<div class="';
                    if(result['root']['audioguides'][0]['audioguide'][i]['downloaded']>0){
                        audioguidanew += 'contenuti-scaricati-box';
                    }else{
                        audioguidanew += 'contenuti-scaricabili-box';
                    }
                    audioguidanew += '" id='+result['root']['audioguides'][0]['audioguide'][i]['id']+'>';
                    audioguidanew += '<h4 class="audioguidename">'+result['root']['audioguides'][0]['audioguide'][i]['title']+' - '+result['root']['audioguides'][0]['audioguide'][i]['location']+'</h4>';
                    audioguidanew += '<h6>Progetto di '+result['root']['audioguides'][0]['audioguide'][i]['authors']+'</h6>';
                    if(result['root']['audioguides'][0]['audioguide'][i]['downloaded']>0){
                        audioguidanew += '<img class="imgthumb column50" src="'+path.resolve() + sl + "content" + sl + result['root']['audioguides'][0]['audioguide'][i]['id']+subId+'/thumb.jpg">';
                        audioguidanew += '<div class="column50">';
                        audioguidanew += '<a data-audioguide="'+result['root']['audioguides'][0]['audioguide'][i]['id']+'" class="load-file">Attiva</a>';
                    }else{
                        audioguidanew += '<img class="imgthumb column50" src="https://www.hi-storia.it/app/'+result['root']['audioguides'][0]['audioguide'][i]['id']+'IT0.jpg">';
                        audioguidanew += '<div class="column50">';
                        audioguidanew += '<a href="#scaricaheader" data-title="'+result['root']['audioguides'][0]['audioguide'][i]['title']+'" data-url="https://www.hi-storia.it/app/'+result['root']['audioguides'][0]['audioguide'][i]['id']+'IT0.zip" class="download-file">Scarica</a>'; //@TODO cambia il default, adesso è hardcoded it0
                    }
                    audioguidanew += '<p class="cs-moreinfo">tipologie: ';
                    var idlanglevel='';
                    for (var h=0; h < result['root']['audioguides'][0]['audioguide'][i]['tipo'].length; h++) {
                        audioguidanew +=result['root']['audioguides'][0]['audioguide'][i]['tipo'][h]['lang'];
                        audioguidanew +=' ';
                        audioguidanew +=result['root']['audioguides'][0]['audioguide'][i]['tipo'][h]['level'];
                        audioguidanew +='; ';
                        idlanglevel+=result['root']['audioguides'][0]['audioguide'][i]['tipo'][h]['id'];
                        if(h<(result['root']['audioguides'][0]['audioguide'][i]['tipo'].length-1)){
                            idlanglevel+=',';
                        }
                    }
                    audioguidanew += '<span data-langlevel="'+idlanglevel+'" class="idlanglevel"></span>';
                    audioguidanew += '</p>';
                    audioguidanew += '<p class="cs-moreinfo">o scopri <a href="#">maggiori informazioni</a></p>';
                    audioguidanew += '</div>';
                    if(result['root']['audioguides'][0]['audioguide'][i]['downloaded']>0){
                        audioguidanew += '<div class="editremoveaudioguide"><a class="removeaudioguide">X</a></div>';
                    }
                    audioguidanew += '</div>';    
                    if(result['root']['audioguides'][0]['audioguide'][i]['downloaded']>0){
                        contenutiscaricati.insertAdjacentHTML( 'beforeend', audioguidanew );
                    }else{
                        // check se online: se non lo è, non aggiungere
                        boxavaliable.insertAdjacentHTML( 'beforeend', audioguidanew );
                    }
                }  
            }else{
                var audioguidanew= '<div class="contenuti-scaricati-box">Nessun contenuto disponibile</div>';
                contenutiscaricati.insertAdjacentHTML( 'beforeend', audioguidanew );
            } 
            console.dir(listaaudioguide)       
        });
        cambiaAudioguida();
        scaricaAudioguida();
        getLangLevel();
        editAudioguideBox();
    });
}

function editAudioguideBox(){
    var removeClassElements = document.getElementsByClassName('removeaudioguide');
    var removeall = document.getElementById('showdeleteaudioguide');
    var removeBoxElements = document.getElementsByClassName('editremoveaudioguide');
    var iseditor=false;
    removeall.onclick = function(){
        for(var h = 0; h < removeBoxElements.length; h++){
            var element = removeBoxElements[h];
            if(iseditor){
                element.style.display = "none";
                element.parentNode.classList.remove("shakebox");
            }else{
                element.style.display = "block";
                element.parentNode.classList.add("shakebox");
            }
        }
        if(iseditor){
            iseditor=false;
        }else{
            iseditor=true;
        }  
    }
    for(var i = 0; i < removeClassElements.length; i++){
      var element = removeClassElements[i];  
      element.addEventListener('click', removeAudioguide);
    }
}

function removeAudioguide() {
    // @TODO: funzione per eliminare i contenuti, come callback finale cancellare dal DOM il box
    var boxaudioguide = this.parentNode.parentNode;
    var boxaudioguideid= boxaudioguide.id
    var title = boxaudioguide.getElementsByClassName('audioguidename')[0].innerHTML;
    if (confirm('Stai cancellando tutti i contenuti di '+title+'. Sei sicuro?')) {
        var deletepath= path.resolve() + sl + "content" + sl + boxaudioguideid + "IT0"; // @TODO messo hardcoded, modificarlo!
        var fs = require('fs');
        var files = [];
        if( fs.existsSync(deletepath) ) {
            files = fs.readdirSync(deletepath);
            files.forEach(function(file,index){
                var curPath = deletepath + sl + file;
                if(fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(deletepath);
            // ora cancello il box dal DOM
            var containeraudioguides = boxaudioguide.parentNode;  
            containeraudioguides.removeChild(boxaudioguide);
            updateDownloadedXmlField(boxaudioguideid,'0');
        }
    } else {
        // tolgo edit mode o non faccio niente?
    }
}

function updateDownloadedXmlField(idaudioguide,status){
    // funzione che aggiorna il campo downloaded dell'audioguida indicata da id
    // lo status può essere 0 (non scaricata) o 1 (scaricata)
    // @TODO valutare lo status 2 per i preferiti
    var xmlcontents = xmlaudioguides['root']['audioguides'][0]['audioguide']
    if(xmlcontents){
        for (var i=0; i < xmlcontents.length; i++) {
            if(xmlaudioguides['root']['audioguides'][0]['audioguide'][i]['id']==idaudioguide){
              xmlaudioguides['root']['audioguides'][0]['audioguide'][i]['downloaded']=status;
              console.log('audioguida modificata')
              createXmlAudioguide();
              break;
            }
        }
      }
}

function cambiaAudioguida(){ // funzione che inizializza i pulsanti per attivare i contenuti-scaricati e disattiva il pulsante per contenuto attivo
    tastiload = document.getElementsByClassName('load-file'); // presente in contenuti-scaricati.html
    for (var i=0; i < tastiload.length; i++) {
        var tempaudioguidadir = tastiload[i].getAttribute("data-audioguide");
        if(tempaudioguidadir==audioguidaid){
            tastiload[i].classList.add("load-file-active");
            tastiload[i].innerHTML='Già attivo';
        }
        tastiload[i].onclick = function(){
            for (var y=0; y < tastiload.length; y++) {
                tastiload[y].classList.remove("load-file-active");
                tastiload[y].innerHTML='Attiva';
            }
            audioguidaid = this.getAttribute("data-audioguide");
            audioguidadir = audioguidaid+'IT0';
            this.classList.add("load-file-active");
            this.innerHTML='Già attivo';
            caricaTracce();
            caricaXml();
            document.getElementById('button-player').click()
        };
    }
    loadingboxIn();
}

function scaricaAudioguida(){
    const path = require('path');
    var contentdir = path.resolve();
    var sl;
    var DecompressZip = require('decompress-zip');
    
    //var ipcRenderer = require('electron').ipcRenderer;
    
                if (process.platform === 'linux') {
                    sl = '/';
                } else if (process.platform === 'win32') {
                    sl = '\\';
                }
                contentdir += sl;
                contentdir += 'content';
    
    var tastidwld = document.getElementsByClassName("download-file");
    var datatitle=''; // per notifier
    
    for (var i=0; i < tastidwld.length; i++) {
      tastidwld[i].onclick = function(){
        var parentdownload=this.parentNode.parentNode.getAttribute("id");
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
        var cancelbutton= document.getElementById("cancel-download");
        var pausebutton= document.getElementById("pause-download");
    
        ipcRenderer.send("download-single", {
            url: this.getAttribute("data-url"),
            properties: {directory: contentdir}
        });

        ipcRenderer.on("download-started", (event) => {
            cancelbutton.onclick = function(){
                if (confirm('Stai annullando questo download. Sei sicuro?')) {
                    ipcRenderer.send("download-cancelled");
                    console.log('download in cancellazione');
                    pausebutton.setAttribute("data-status", "active")
                    pausebutton.innerHTML='Pausa'
                }
            }
            pausebutton.onclick = function(){
                if (pausebutton.getAttribute("data-status")=="active") {
                    ipcRenderer.send("download-paused");
                    pausebutton.setAttribute("data-status", "pause")
                    pausebutton.innerHTML='Riprendi'
                    console.log('download in pausa');
                }else{
                    ipcRenderer.send("download-resumed");
                    pausebutton.setAttribute("data-status", "active")
                    pausebutton.innerHTML='Pausa'
                    console.log('download ripreso');
                }
            }
        });
    
        progressdiv.style.display = "block";
        downloadbox.style.display = "block";
        this.classList.add("download-file-active");
        this.innerHTML='In download';
        boxavaliable.style.pointerEvents = "none";
        
        ipcRenderer.on("download-progress", (event, progressObj) => {
          const progressInPercentage=progressObj.progress * 100
          const cleanProgressPercentage=Math.round(progressInPercentage);
          progressbar.style.width=cleanProgressPercentage+'%';
          progressbar.innerHTML = cleanProgressPercentage+'%';
        });
    
        ipcRenderer.on("download-cancel", (event, item) => {
            console.log('download annullato');
            cancelbutton.onclick = null;
            progressbar.style.width='0%';
            progressbar.innerHTML = '0%';
            progressdiv.style.display = "none";
            downloadbox.style.display = "none";
            this.classList.remove("download-file-active");
            this.innerHTML='Scarica';
            boxavaliable.style.pointerEvents = "all";
        });
    
        ipcRenderer.on("download-finished", (event, item) => {
          //notify_download();
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
              updateDownloadedXmlField(parentdownload,'1');
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
}

function createXmlAudioguide(){
    var fs2 = require('fs'),
    xml2js2 = require('xml2js');
    var obj = xmlaudioguides;
    var builder = new xml2js2.Builder();
    var xml2 = builder.buildObject(obj);
    fs2.writeFile("content/content.xml", xml2, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
        loadAudioguides();
    });
}

function caricaTracce() {
            if (process.platform === 'linux') {
                sl = '/';
            } else if (process.platform === 'win32') {
                sl = '\\';
            }
            contentdir = path.resolve() + sl + "content" + sl + audioguidadir; 
            fs.readdir(contentdir, (err, files) => {
                let fileObject = { sl: sl, loc: contentdir, files: [] };
                files.forEach((current_file) => {
                    if (current_file.endsWith('.mp3') || current_file.endsWith('.wav')
                        || current_file.endsWith('.m4a') || current_file.endsWith('.MP3')
                        || current_file.endsWith('.WAV') || current_file.endsWith('.M4A')) {
                        fileObject.files.push(current_file);
                    }
                });
                elaboraTracce(fileObject);
            });
}

function elaboraTracce(obj){
    reset_ui();
    if (current_song) {
        current_song.pause();
        current_song = null;
        current_audioguide.innerHTML=' ';
        current_audioguide_player.innerHTML=' ';
        org_name.innerHTML=' ';
    }
    let gi = 0;
    curren_index = 0;
    sl = obj.sl;
    playList = [];
    global_loc = obj.loc;
    console.dir(obj)
    obj.files.forEach((file) => {
            let tmp = new Audio();
            tmp.src = global_loc + sl + file;
            tmp.loop = false;
            playList.push({
                index: gi,
                //index: obj.files.keys(),
                song: file,
                song_name: file
            })
            tmp.onloadeddata = function () {
                playList[gi].duration= tmp.duration;
                var nodesong = document.createElement("li");  
                nodesong.classList.add('list')
                var textsong = document.createTextNode('<span class="index">'+(gi+1)+'</span><span class="song">'+playList[gi].song_name+'</span><span class="duration">'+toTime(playList[gi].duration)+'</span>'); 
                nodesong.appendChild(textsong);
                song_list.appendChild(nodesong);
                gi++;
            }
    });
}

function caricaXml(){ // leggo il file xml della singola audioguida
    var extractedData = "";
    contentdir2 = path.resolve() + sl + "content" + sl + audioguidadir; 
    fs.readFile(contentdir2 + sl +'audioguide.xml', function(err, data) {
        parser.parseString(data, function (err, result) {
            xmlaudioguida=result;
            listatracce=result['audioguide']['tracks'];
            console.log('Letto ' +contentdir2 + '/audioguide.xml');
            extractedData = result['audioguide']['header'];
            current_audioguide.innerHTML= extractedData; // \u00a0 is non-breakable space
            current_audioguide_player.innerHTML=extractedData; // \u00a0 is non-breakable space
            org_name.innerHTML=result['audioguide']['authors']; // \u00a0 is non-breakable space
            settings.set('activeAudioguideId', result['audioguide']['id'])
            activeAudioguideLangId= result['audioguide']['langid'];
            activeAudioguideLevelId= result['audioguide']['levelid'];
            if(err)console.log(err);
            // CAMBIA SFONDO
            //if(result['audioguide']['bg']){
            //    document.getElementById("bg-player").style.backgroundImage = "url("+result['audioguide']['bg']+")"; // temp cambio bg da qui
            //}else{
                if(document.getElementById("player-section")){
                    var newurlbg=  path.resolve() + sl + "content" + sl + audioguidadir  + "/1.jpg";
                    newurlbg= newurlbg.replace(/\\/g, "/")
                    document.getElementById("player-section").style.backgroundImage = "url("+newurlbg+")"; // temp cambio bg da qui
                }
            //}
        });
        if(sameaudioguide==0){
            getLangLevel();
        }else{
            sameaudioguide=0;
        }
    });
}

function getLangLevel(){
    var currentAudBox = document.getElementById(audioguidaid);
    if(currentAudBox){
        var child = currentAudBox.getElementsByClassName("idlanglevel")[0];
        var datasLangLev= child.getAttribute("data-langlevel");
        var arrayLangLev = datasLangLev.split(',');
        var selectLang = document.getElementById('selectLang')
        var selectLevel = document.getElementById('selectLevel')
        selectLang.innerHTML = "";
        selectLevel.innerHTML = "";
        var ITlang, ENlang, FRlang, DElang,ESlang,ZHlang, pertuttilv, bambinilv, nonvedentilv, espertilv ;
        ITlang = ENlang = FRlang = DElang = ESlang = ZHlang = pertuttilv = bambinilv = nonvedentilv = espertilv= true;
        for (var i=0; i < arrayLangLev.length; i++) {
            var actualLang = arrayLangLev[i].substring(0, 2);
            var actualLevel = arrayLangLev[i].substring(2, 3);
            switch (actualLang) {
                case 'IT':
                    if(ITlang){
                        var optLang = document.createElement("option");
                        optLang.value='IT'
                        optLang.innerHTML='italiano';
                        selectLang.appendChild(optLang);
                        ITlang=false;                    
                    }
                    break; 
                case 'EN':
                    if(ENlang){
                        var optLang = document.createElement("option");
                        optLang.value='EN'
                        optLang.innerHTML='english';
                        selectLang.appendChild(optLang);
                        ENlang=false;                    
                    }
                    break; 
                case 'FR':
                    if(FRlang){
                        var optLang = document.createElement("option");
                        optLang.value='FR'
                        optLang.innerHTML='français';
                        selectLang.appendChild(optLang);
                        FRlang=false;                    
                    }
                    break; 
                case 'DE':
                    if(DElang){
                        var optLang = document.createElement("option");
                        optLang.value='DE'
                        optLang.innerHTML='deutsch';
                        selectLang.appendChild(optLang);
                        DElang=false;                    
                    }
                    break; 
                case 'ES':
                    if(ESlang){
                        var optLang = document.createElement("option");
                        optLang.value='ES'
                        optLang.innerHTML='español';
                        selectLang.appendChild(optLang);
                        ESlang=false;                    
                    }
                    break; 
                case 'ZH':
                    if(ZHlang){
                        var optLang = document.createElement("option");
                        optLang.value='ZH'
                        optLang.innerHTML='中文';
                        selectLang.appendChild(optLang);
                        ZHlang=false;                    
                    }
                    break; 
            }
            switch (actualLevel) {
                case '0':
                    if(pertuttilv){
                        var optLevel = document.createElement("option");
                        optLevel.value=0
                        optLevel.innerHTML='per tutti';
                        selectLevel.appendChild(optLevel);
                        pertuttilv=false;
                    }
                    break; 
                case '1':
                    if(bambinilv){
                        var optLevel = document.createElement("option");
                        optLevel.value=1
                        optLevel.innerHTML='bambini';
                        selectLevel.appendChild(optLevel);
                        bambinilv=false;
                    }
                    break; 
                case '2':
                    if(nonvedentilv){
                        var optLevel = document.createElement("option");
                        optLevel.value=2
                        optLevel.innerHTML='non vedenti';
                        selectLevel.appendChild(optLevel);
                        nonvedentilv=false;
                    }
                    break;  
                case '3':
                    if(espertilv){
                        var optLevel = document.createElement("option");
                        optLevel.value=3
                        optLevel.innerHTML='esperti';
                        selectLevel.appendChild(optLevel);
                        espertilv=false;
                    }
                    break; 
            }
        }
    }
}

function loadUI(){
    volume_slider=document.getElementById("vol-progress");
    volume_current = document.getElementById("vol-current");
    global_volume = volume_current.offsetWidth / volume_slider.offsetWidth * 100;
    progress = document.getElementById("progress");
    current = document.getElementById("current");
    current_play = document.getElementsByClassName("current-song");
    current_audioguide = document.getElementById("audioguidename");
    current_audioguide_player = document.getElementById("current-audioguide");
    org_name = document.getElementById("org-name");
    song_duration = document.getElementById("seek-duration");
    seek_pos = document.getElementById("seek-pos");
    index_song = document.getElementsByClassName("index-song")
    pl_pa = document.getElementById("play");
    next = document.getElementById("next");
    prev = document.getElementById("prev");
    vol = document.getElementById("vol");
    song_list = document.getElementById("list-ul");


volume_slider.addEventListener("mousedown",function(event){
    init_global_vol(event.pageX);
    volume_slider.addEventListener("mousemove",function(event){
        init_global_vol(event.pageX);
        prev_vol = global_volume;
    });
    prev_vol = global_volume;
});

document.getElementById('omask').addEventListener("click",function(event){
    document.getElementById('menu-toggle').checked = false;
});

progress.addEventListener("mousedown", progressmousedown);
function progressmousedown(){
    init_seek(event.pageX);
    progress.addEventListener("mousedown", progressmousemove);
}
function progressmousemove(){
    init_seek(event.pageX);
}

document.addEventListener("mouseup",function(event){
    //TODO da fare volume_slider.removeEventListener("mousemove");
    progress.removeEventListener("mousemove", progressmousedown);
    progress.removeEventListener("mousemove", progressmousemove);
});

vol.addEventListener("click",function(event){
    toggle_mute();
});

pl_pa.addEventListener("click",function(event){
    if (current_song) {
        toggle_play();
    }
});

next.addEventListener("click",function(event){
    next_song();
});

prev.addEventListener("click",function(event){
    prev_song();
});

}

function reset_ui() {
    volume_slider=document.getElementById("vol-progress");
    for (var isong=0; isong < index_song.length; isong++) {
        index_song[isong].innerHTML='0';
    }
    for(var c = 0; c < current_play.length; c++){
        current_play[c] .innerHTML='&nbsp;'; // \u00a0 is non-breakable space
    }
    current_audioguide.innerHTML='&nbsp;';
    current_audioguide_player.innerHTML='&nbsp;';
    org_name.innerHTML='&nbsp;';
    song_duration.innerHTML='&nbsp;';
    seek_pos.innerHTML='&nbsp;';
    current.style.width = "0%"; 
}

function toTime(seconds) {
    var min = Math.floor(seconds / 60) || 0;
    var sec = parseInt(seconds - min * 60) || 0;
    return min + ':' + (sec < 10 ? '0' : '') + sec;
}

function song_change() {
    var songlistchild=song_list.childNodes;
    for(var i = 0; i < songlistchild.length; i++)
    {
        songlistchild[i].classList.remove("selected")
        if(i==curren_index){
            songlistchild[i].classList.add("selected")
        }
    }
    init_play();
}

function init_global_vol(mx) {
    var rect = volume_slider.getBoundingClientRect();
    let rp = parseInt(rect.left);
    let w = parseInt(volume_slider.offsetWidth);
    let rmx = mx - rp;
    global_volume = (mx - rp) / w * 100;
    volume_current.style.width = global_volume + '%';
    if (current_song) {
        let tmp_vol = ((global_volume / 100) > 1) ? 1 : global_volume / 100;
        current_song.volume = tmp_vol;
    }
}

function init_seek(mx) {
    if (current_song) {
        var rect = progress.getBoundingClientRect();
        let rp = parseInt(rect.left);
        let w = parseInt(progress.offsetWidth);
        let dx = current_song.duration / w;
        let rmx = mx - rp
        current_song.currentTime = (dx * rmx);
        let perc = rmx / w * 100;
        current.style.width = perc + '%';
    }
}

function update_seek() {
    requestAnimationFrame(update_seek);
    if (current_song) {
        seek_pos.innerHTML=toTime(current_song.currentTime);
        let w = parseInt(progress.offsetWidth);
        let dy = w / current_song.duration;
        current.style.width = dy * current_song.currentTime+'px';
    }
}

function change_pl_ico() {
    if (!current_song.paused) {
        pl_pa.classList.remove("fa-play");
        pl_pa.classList.add("fa-pause");

    } else {
        pl_pa.classList.remove("fa-pause");
        pl_pa.classList.add("fa-play");
    }
}

function init_play() {
    if (current_song) {
        current_song.pause();
        change_pl_ico();
    }
    current_song = new Audio();
    current_song.src = global_loc + sl + playList[curren_index].song;
    //current_song.onended = next_song;//
    current_song.onloadeddata = function () {
        for(var c = 0; c < current_play.length; c++){
            current_play[c] .innerHTML=(listatracce)[0]['track'][curren_index]['title'];
        }
        song_duration.innerHTML=toTime(current_song.duration);
        for (var isong=0; isong < index_song.length; isong++) {
            index_song[isong].innerHTML=curren_index+1;
        }
        let tmp_vol = ((global_volume / 100) > 1) ? 1 : global_volume / 100;
        current_song.volume = tmp_vol;
        toggle_play();
        //initVisualiser();
    }
    notify_track();
    console.debug("Traccia "+playList[curren_index].song_name);
    console.log("traccia"+playList[curren_index].song_name);
    if(document.getElementById("player-section")){
        var urlbg=  path.resolve() + sl + "content" + sl + audioguidadir + sl +(curren_index+1)+".jpg";
        urlbg= urlbg.replace(/\\/g, "/");
        document.getElementById("player-section").style.backgroundImage = "url("+urlbg+")"; // temp cambio bg da qui
    }
}

function notify_track(){
    const notifier = require('node-notifier');
    const path = require('path');
  
  notifier.notify(
    {
      title: 'Traccia '+(playList[curren_index].index+1),
      message: 'La traccia attiva sul player Hi-Storia è "'+playList[curren_index].song_name+'"',
      icon: path.join(__dirname, 'logo.png'), // Absolute path (doesn't work on balloons)
      sound: false, // Only Notification Center or Windows Toasters
      wait: false // Wait with callback, until user action is taken against notification
    },
    function(err, response) {
      // Response is response from notification
    }
  );
  
  notifier.on('click', function(notifierObject, options) {
    // Triggers if `wait: true` and user clicks notification
  });
  
  notifier.on('timeout', function(notifierObject, options) {
    // Triggers if `wait: true` and notification closes
  });
}

function toggle_mute() {
    if (current_song) {
        if (current_song.volume == 0) {
            let rp = parseInt(volume_slider.offset().left);
            let w = parseInt(volume_slider.width());
            init_global_vol((prev_vol * w / 100) + rp);
            vol.classList.remove("fa-volume-off");
            vol.classList.add("fa-volume-up");
        } else {
            prev_vol = global_volume;
            init_global_vol(parseInt(volume_slider.offset().left));
            vol.classList.remove("fa-volume-up");
            vol.classList.add("fa-volume-off");
        }
        volume_current.css('width', global_volume + '%');
    }
}

function toggle_play() {
    if (!current_song.paused) {
        current_song.pause();
    } else {
        current_song.play();
    }
    change_pl_ico();
}

function next_song() {
    if (curren_index == playList.length - 1) {
        curren_index = 0
    } else {
        curren_index++;
    }
    song_change();
}

function prev_song() {
    if (curren_index == 0) {
        curren_index = playList.length - 1;
    } else {
        curren_index--;
    }
    song_change();
}

window.addEventListener("keypress",function(e){
  if (e.which === 32) {
    if (current_song) {
      toggle_play();
    }
  }
});

update_seek();

function detectConnect(){
    switch(is_connected) {
        case -1:
            document.getElementById("is_loading").style.display = "none";
            document.getElementById("is_connected").style.display = "block";
            break;
        case 0:
        document.getElementById("is_loading").style.display = "none";
            document.getElementById("is_connected").style.background = "rgba(57,170,176,0.5)";
            break;
        case 1:
        document.getElementById("is_loading").style.display = "none";
            document.getElementById("is_connected").style.display = "none";
            break;
        default:
    }
}
detectConnect();

document.getElementById("update-page").onclick = function(){
    location.reload()
}

const serialport = require('serialport')
var porta = require('serialport');

port_now=0; // @TODO da eliminare, per ora lo uso per fare test

serialport.list((err, ports) => {
    console.log('ports', ports);
    if (err) {
        is_connected=2;
        detectConnect();
        document.getElementById('errorport').textContent = err.message
        return
    }

    if (ports.length === 0) {
        is_connected=-1;
        detectConnect();
        document.getElementById('errorport').textContent = 'Nessuna porta trovata'
        //@TODO fai anche alert
        return     //al posto di questo return va fatta una funzione per richiamare dopo x secondi
    }else{
        is_connected=1;
        document.getElementById('errorport').textContent = ''
        ipcRenderer.send("com-started")
        detectConnect();
        openPort();
    }

    var port;
    function openPort(){
        var portsanalisys=document.getElementById("ports-analisys")
        portsanalisys.innerHTML='tentativo di connessione alla porta '+ports[port_now].comName;
        port = new porta(ports[port_now].comName, { //@TODO qui va fatto il parsing delle porte
            //var port = new SerialPort('COM7', {
            //var port = new SerialPort('/dev/tty-usbserial1', {
                baudRate: 115200
        });

        const headers = Object.keys(ports[0])
        var txt = '';
        txt += '<div style="display: table-row;background-color:#ffe;font-weight:bold">';
        for (var h in headers) {
        txt += '<div class="ports-cell" style="display: table-cell;border:1px solid #ddd">' + headers[h] + '</div>';		
        }
        txt += '<div class="ports-cell" style="display: table-cell;border:1px solid #ddd">stato</div>';		
        txt += '</div>';
        for (var x in ports) {
        txt += '<div class="row-portslist';
        if(x==port_now){
            txt +=' portlist-now';
        }
        txt +='">';
        for (var y in ports[x]) {
            var valore = ports[x][y];
            if (valore == null){
            valore='';
            }
            txt += '<div class="ports-cell" style="display: table-cell;border:1px solid #ddd">' + valore + '</div>';
            //Object.values(ports);
        }
        txt += '<div class="ports-cell-comnow ports-cell" style="display: table-cell;border:1px solid #ddd;word-break: normal;">';
        if(x==port_now){
            txt +='<span class="blinking-text">in connessione</span>';
        }else{
            txt +='<a class="active-com-button" href="#" data-com="'+x+'">attiva ora</a>';
        }
        txt += '</div></div>';
        }
        document.getElementById("list-ports").innerHTML = txt;
        
        // La porta attiva va in "flowing mode"
        port.on('data', function (data) {
            console.log('Data:', data);
            var segnaleArduino = parseInt(data[0], 10);
            if(segnaleArduino==90){ //if arduino con write
            port.write("H");
            is_connected=4;
            portsanalisys.innerHTML='connesso a '+ports[port_now].comName;
            var ActivePortCell = document.getElementsByClassName('ports-cell-comnow');
            ActivePortCell[port_now].innerHTML='<b>connesso</b>';
            }else{
            if(segnaleArduino>47 && segnaleArduino<77){ //if microbit o altre schede che hanno print (ascii) e non write (bit)
                curren_index = segnaleArduino - 49;
                song_change();
            }
            if(segnaleArduino<9){
                curren_index = segnaleArduino - 1;
                song_change();
            }
            }
        });

        port.on('error', function(err) {
            console.log('Errore: ', err.message);
        })

        // Read data that is available but keep the stream from entering "flowing mode"
        port.on('readable', function () {
            detectConnect();
            console.log('Datas:', port.read());
        });

        var activeComButton = document.getElementsByClassName('active-com-button');
        for (var y=0; y < activeComButton.length; y++) {
            activeComButton[y].onclick = function(){
                port_now = this.getAttribute("data-com");
                port.write("h");
                port.close();
                openPort();
                return;
            }
        }

        setTimeout(function() {  
            console.log(is_connected)
            if(is_connected==1){ // cambio com
                port.close();
                if (ports.length == (port_now+1))
                {
                    port_now = 0;
                }else{
                    port_now++;			
                }
                openPort();
            }
        }, 5000);

        window.onbeforeunload  = (e) => {
            port.write("h");
        }
    }
    
})

selectLevel.onchange = function(){
    console.log(selectLevel.value);
    audioguidaid = settings.get('activeAudioguideId');
    audioguidadir = audioguidaid+selectLang.value+selectLevel.value;
    sameaudioguide=1;
    caricaTracce();
    caricaXml();
}

selectLang.onchange = function(){
    console.log(selectLang.value);
    audioguidaid = settings.get('activeAudioguideId');
    audioguidadir = audioguidaid+selectLang.value+selectLevel.value;
    sameaudioguide=1;
    caricaTracce();
    caricaXml();
}

function loadingboxIn(){
    if(document.getElementById('loadingbox').style.display == "none"){
        document.getElementById('loadingbox').style.display = "block";
    }else{
        document.getElementById('loadingbox').style.display = "none";
    }
}