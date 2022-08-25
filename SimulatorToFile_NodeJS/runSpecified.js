const http = require('http');
const fs = require('fs');
const util = require('util');
const stream = require('stream');
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
const finished = util.promisify(stream.finished);
var ZoO,ZoA,TR,Duration,numRep,logStream
var pX,pY,pZ,oX,oY,oZ
var precision = 4; // Precision of coordinates for storage

const server = http.createServer((_req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.end('Check console\n')
})

// create multibar
const multibar = new cliProgress.MultiBar({
  format: '{name}: {bar} {percentage}% | ETA: {eta_formatted} | {value}/{total}',
  clearOnComplete: false,
  hideCursor: true,
}, cliProgress.Presets.rect);

// parameters
var zones = [0.,3.75,7.5,11.25,15.];
var trs = [10,20.6,42.43,87.39,180];
var ZoR = 1;
var FoV = 272.5;
var Err = 5.75;
var numRep = 100;
var Duration = 20;
var numSim = 125;

// create bars
const frameBar = multibar.create(Duration*60, 0, {name:'Frame'.padEnd(10, ' ')});
const repBar = multibar.create(numRep, 0, {name:'Iteration'.padEnd(10, ' ')});
const simBar = multibar.create(numSim, 0, {name:'Simulation'.padEnd(10, ' ')});

// timer
const timer = ms => new Promise(res => setTimeout(res, ms))

simulate();

async function simulate(){
  for (let zooID = 0; zooID<5; zooID++){
    for (let zoaID = 0; zoaID<5; zoaID++){
      for (let trID = 0; trID<5; trID++){
        ZoO = zones[zooID];
        ZoA = zones[zoaID];
        TR = trs[trID];
        // create file
        createFile(zooID+1,zoaID+1,trID+1);

        // reset bar
        repBar.update(0);

        // loop for repetitions
        for (let repID = 1; repID<=numRep; repID++){
          // reset bar
          frameBar.update(0);
          // initiate simulation
          let [, , agentDat, sceneProp] = SIM.simInit(ZoR,ZoO,ZoA,FoV,TR,Err);

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
              // write line
              appendLine(repID,agID+1,frameID,pX.toFixed(precision),pY.toFixed(precision),pZ.toFixed(precision),oX.toFixed(precision),oY.toFixed(precision),oZ.toFixed(precision));
            }
            frameBar.increment();
            multibar.update();
            // close frames
          }
          repBar.increment();
          multibar.update();
          // close rep
        }
        simBar.increment();
        multibar.update();
        closeFile();
        // wait for 1000 ms, allows for filewrite during loop
        await timer(1000);
        // close tr
      }
      // close zoa
    }
    // close zoo
  }
  // stop bars
  multibar.stop();
}

function createFile(ZoOID,ZoAID,TRID){
    var header = '"Repetition","AgentID","Frame","pX","pY","pZ","oX","oY","oZ"\n';
    logStream = fs.createWriteStream(path+'ZoO'+ZoOID+'_ZoA'+ZoAID+'_TR'+TRID+'_Dur'+Duration+'_'+numRep+'.csv', { flag: 'a+' }, function (err) {
        if (err) throw err;
        console.log("File created");
    });
    logStream.write(header);
}

function appendLine(repID,agID,frameID,pX,pY,pZ,oX,oY,oZ){
    logStream.write(repID+','+agID+','+frameID+','+pX+','+pY+','+pZ+','+oX+','+oY+','+oZ+'\n');
}

function closeFile(){
  logStream.end();
}
