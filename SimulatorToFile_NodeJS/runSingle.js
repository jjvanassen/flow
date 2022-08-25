const http = require('http');
const fs = require('fs');
//NPM
const readlineSync = require('readline-sync');
const cliProgress = require('cli-progress');
const THREE = require('three');
//Own external files
const SIM = require('./js/simulator.js');
const FUNC = require('./js/functions.js');

const hostname = '127.0.0.1'
const port = 3000

const path = '/sims/' // Output path
var ZoO,ZoA,TR,Duration,numRep,logStream
var pX,pY,pZ,oX,oY,oZ
var precision = 4; // Precision of coordinates for storage
var ZoR = 1;
var FoV = 272.5;
var Err = 5.75;

const server = http.createServer((_req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.end('Check console\n')
})

setSettings()

function setSettings(){
ZoO = readlineSync.question(`Set radius of Zone of Orientation `);
ZoA = readlineSync.question(`Set radius of Zone of Attraction `);
TR = readlineSync.question(`Set Turning Rate `);
Duration = readlineSync.question(`Set the duration in seconds `);
numRep = readlineSync.question(`Set the number of repetitions `);
if (readlineSync.keyInYN(`Start the simulation with the following settings:
ZoO = `+ZoO+`
ZoA = `+ZoA+`
TR = `+TR+`
Duration = `+Duration+`
Repetitions = `+numRep+`
Continue? `)) {
    // 'Y' key was pressed.
    console.log('Starting simulation...');
    createFile();

    // create multibar
    const multibar = new cliProgress.MultiBar({
      format: '{name}: {bar} {percentage}% | ETA: {eta_formatted} | {value}/{total}',
      clearOnComplete: false,
      hideCursor: true,
    }, cliProgress.Presets.rect);

    // create bars
    const frameBar = multibar.create(Duration*60, 0, {name:'Frame'.padEnd(10, ' ')});
    const repBar = multibar.create(numRep, 0, {name:'Iteration'.padEnd(10, ' ')});

    // loop for repetitions
    for (let repID = 1; repID<=numRep; repID++){
      // reset bar
      frameBar.update(0);
      // initiate simulation
      let [, , agentDat, sceneProp] = SIM.simInit(ZoR,ZoO,ZoA,FoV,TR,Err);
      // loop for frames
      for (let frameID = 1; frameID<=Duration*60; frameID++){
        // run simulation
        agentDat = SIM.simUpdate(agentDat,sceneProp);
        // loop to read out agent data
        for (let agID = 0; agID<sceneProp.NumAgents; agID++){
          pX = agentDat.position[ agID * 3 ];
					pY = agentDat.position[ agID * 3 + 1 ];
					pZ = agentDat.position[ agID * 3 + 2 ];
          oX = agentDat.orientation[ agID * 3 ];
					oY = agentDat.orientation[ agID * 3 + 1 ];
					oZ = agentDat.orientation[ agID * 3 + 2 ];
          // store data
          appendLine(repID,agID+1,frameID,pX.toFixed(precision),pY.toFixed(precision),pZ.toFixed(precision),oX.toFixed(precision),oY.toFixed(precision),oZ.toFixed(precision));
        }
        frameBar.increment();
        multibar.update();
      }
      repBar.increment();
      multibar.update();
    }
    // stop bars
    multibar.stop();
  } else {
    // 'N' key was pressed.
    console.log('Starting new query...');
    setSettings();
  }
}

function createFile(){
    var header = '"Repetition","AgentID","Frame","pX","pY","pZ","oX","oY","oZ"\n';
    logStream = fs.createWriteStream(path+'ZoO'+ZoO+'_ZoA'+ZoA+'_TR'+TR+'_Dur'+Duration+'_'+numRep+'.csv', { flag: 'a+' }, function (err) {
        if (err) throw err;
        console.log("File created");
    });
    logStream.write(header);
}

function appendLine(repID,agID,frameID,pX,pY,pZ,oX,oY,oZ){
    logStream.write(repID+','+agID+','+frameID+','+pX+','+pY+','+pZ+','+oX+','+oY+','+oZ+'\n');
}
