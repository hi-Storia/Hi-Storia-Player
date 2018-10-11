// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const serialport = require('serialport')
var porta = require('serialport');


serialport.list((err, ports) => {
  console.log('ports', ports);
  if (err) {
    console.log('errore', err.message); // @TODO deve diventare elemento grafico
    return
  }

  if (ports.length === 0) {
    console.log('nessuna porta trovata'); // @TODO deve diventare elemento grafico
    return     //al posto di questo return va fatta una funzione per richiamare dopo x secondi
  }

  var port = new porta(ports[0].comName, {
    //var port = new SerialPort('COM7', {
    //var port = new SerialPort('/dev/tty-usbserial1', {
        baudRate: 115200
    });
    
    // Switches the port into "flowing mode"
    port.on('data', function (data) {
      console.log('Data:', data);
    });
    
    // Read data that is available but keep the stream from entering "flowing mode"
    port.on('readable', function () {
      console.log('Data:', port.read());
    });
})
