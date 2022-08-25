
import * as THREE from '/js/three.module.js';
import Stats from '/js/stats.module.js';
import { GUI } from '/js/dat.gui.module.js';
import * as MYFUNC from '/js/functions.js';

// Scene variables
var camera, scene, renderer, stats, helper;

// Sim settings
var maxAgents = 200;
var numAgents = 25;
var sceneSize = 50;
var fixedSize = 50;
var sceneHalf = sceneSize / 2;
var plotSize = sceneSize / 10;
var minCol = 0.02;
var maxCol = 1.;
var runSim = true;
var lengthLine = 1 - (sceneSize / 100) + 0.5;
var informedFactor = 16;
var boxVis = true;

// Agent data
var agents, group, pointCloud, linesMesh,linePositions, lineColors, geometry;
var posArray, orArray, speedArray, informed, infArray;
var agentDat = []; // container for position, direction etc.
var agentProp = {
  BgC: 0x202020,
  AgsC: 0xFFFFFF,
  NumAgents: numAgents,
  SceneSize: 50,
  ZoR: 1,
  ZoO: 3,
  ZoA: 10,
  FoV: 280,
  Turn: 55,
  Informed: 0,
  Speed: 7/60,
  ErrorAngle: 4.,
  ErrorSpeed: 0.,
  RoI: new THREE.Vector3(0,0,0),
  Freeze: false,
  Box: true,
};

var point = { add:function(){ console.log("clicked") }}
var line = { add:function(){ console.log("clicked") }};
var ellipsoid = { add:function(){ console.log("clicked") }};
var cone = { add:function(){ console.log("clicked") }};
var flock = { add:function(){ agentProp.ZoR = 7.;
  agentProp.ZoR = 2.;
  agentProp.ZoO = 3.;
  agentProp.ZoA = 15.;
  agentProp.FoV = 180;
  agentProp.Turn = 145.;
  agentProp.ErrorAngle = 6.;
  agentProp.ErrorSpeed = 1.;
}};
var school = { add:function(){
  agentProp.ZoR = 1.;
  agentProp.ZoO = 9.;
  agentProp.ZoA = 7.;
  agentProp.FoV = 200.;
  agentProp.Turn = 100.;
  agentProp.ErrorAngle = 6.;
  agentProp.ErrorSpeed = 1.;
}};
var swarm = { add:function(){
  agentProp.ZoR = 1.;
  agentProp.ZoO = 0.;
  agentProp.ZoA = 15.;
  agentProp.FoV = 220;
  agentProp.Turn = 180.;
  agentProp.ErrorAngle = 10.;
  agentProp.ErrorSpeed = 1.;
}};

var resetA = { add:function(){
  resetAgents();
  console.log("reset angents");
}};
var fullReset = { add:function(){
  resetAgents();
  // Improve this part
  numAgents = 25;
  geometry.setDrawRange( 0, numAgents*2);
  agentProp.NumAgents = numAgents;
  agentProp.SceneSize = 50;
  agentProp.ZoR= 1;
  agentProp.ZoO= 3;
  agentProp.ZoA= 10;
  agentProp.FoV= 280;
  agentProp.Turn= 55;
  agentProp.Informed= 0;
  agentProp.Speed= 7/60;
  agentProp.ErrorAngle= 4.;
  agentProp.ErrorSpeed= 1.;

  sceneHalf = agentProp.SceneSize / 2;
  plotSize = agentProp.SceneSize / 10;
  camera.position.z = agentProp.SceneSize*1.5;
  scene.remove(helper)
  helper = new THREE.BoxHelper( new THREE.Mesh( new THREE.BoxBufferGeometry( agentProp.SceneSize, agentProp.SceneSize, agentProp.SceneSize/2) ) );
  helper.material.color.setHex( 0xAAAAAA);
  helper.material.transparent = true;
  helper.name = "helper";
  scene.add( helper );
  console.log("full reset");
}};

// GUI
function initGUI() {
  var gui = new GUI();
  var agentsFolder = gui.addFolder("Global properties");
  agentsFolder.add( agentProp, "NumAgents", 1, maxAgents, 1).name("Agents")
  .listen()
  .onChange(function( value ) {
    numAgents = parseInt( value );
    agents.setDrawRange( 0, numAgents);
    geometry.setDrawRange( 0, numAgents*2);
    // update informed agent ratios
    informed = MYFUNC.randArray(numAgents,Math.round(numAgents*agentProp.Informed/100));
    for ( var aID = 0; aID < maxAgents; aID ++ ) {
      if (informed.includes(aID)){
        agentDat.informedness[ aID ] = Math.random()/informedFactor;
      }else{
        agentDat.informedness[ aID ] = 0.;
      }
    }
  });
  agentsFolder.add( agentProp, "SceneSize", 10, 100, 1).name("Scene Size")
  .listen()
  .onChange(function( value ) {
    sceneHalf = agentProp.SceneSize / 2;
    plotSize = agentProp.SceneSize / 10;
    lengthLine = 1 - (sceneSize / 100) + 0.5;
    camera.position.z = agentProp.SceneSize*1.5;

    scene.remove(helper)
    helper = new THREE.BoxHelper( new THREE.Mesh( new THREE.BoxBufferGeometry( agentProp.SceneSize, agentProp.SceneSize, agentProp.SceneSize/2) ) );
    helper.material.color.setHex( 0xAAAAAA);
    helper.material.transparent = true;
    helper.name = "helper";
    scene.add( helper );

    resetAgents();
  });
  agentsFolder.add( agentProp, "ZoR", 0, 5, 0.1 ).name("Repulsion").listen();//0-15
  agentsFolder.add( agentProp, "ZoO", 0, 15, 0.1 ).name("Orientation").listen();//0-15
  agentsFolder.add( agentProp, "ZoA", 0, 15, 0.1 ).name("Attraction").listen();//0-15
  agentsFolder.add( agentProp, "FoV", 90, 350, 1 ).name("Field of View").listen();//90-360
  agentsFolder.add( agentProp, "Turn", 10, 200, 1).name("Turning Rate").listen();//10-360
  agentsFolder.add( agentProp, "ErrorAngle", 0, 15, 0.1 ).name("Error").listen();//0-15

    var presetsFolder = gui.addFolder("Presets");
    presetsFolder.add(flock,'add').name("Birds");
    presetsFolder.add(school,'add').name("Fish");
    presetsFolder.add(swarm,'add').name("Flies");

    gui.add(agentProp,'Freeze').name("Freeze").onChange(function( value ) {
      runSim = !runSim;
    });
    gui.add(agentProp,'Box').name("Box").onChange(function( value ) {
      boxVis = !boxVis;
    });
    gui.add(resetA,'add').name("Reset agents");
    gui.add(fullReset,'add').name("Full reset");
  }

function agentInit(){
  posArray = new Float32Array( maxAgents * 3 );
  orArray = new Float32Array( maxAgents * 3 );
  speedArray = new Float32Array( maxAgents );
  infArray = new Float32Array( maxAgents );

  informed = MYFUNC.randArray(numAgents,Math.round(numAgents*agentProp.Informed/100));

  for ( var aID = 0; aID < maxAgents; aID ++ ) {
    // Position assignment
    var vecIn = new THREE.Vector3(Math.random() * plotSize - plotSize / 2,Math.random() * plotSize - plotSize / 2,Math.random() * plotSize - plotSize / 2);
    posArray = MYFUNC.writeVec3(aID,posArray,vecIn);
    // Orientation assignment
    var vecIn = new THREE.Vector3(Math.random() * plotSize - plotSize / 2,Math.random() * plotSize - plotSize / 2,Math.random() * plotSize - plotSize / 2).normalize();
    orArray = MYFUNC.writeVec3(aID,orArray,vecIn);
    // Speed assignement
    speedArray[ aID ] = 1.;
    // Informedness assignement
    if (informed.includes(aID)){
      infArray[ aID ] = Math.random()/informedFactor;
    }else{
      infArray[ aID ] = 0.;
    }
  }
  agentDat.position = posArray;
  agentDat.orientation = orArray;
  agentDat.speed = speedArray;
  agentDat.informedness = infArray;
}

function resetAgents(){
  for ( var aID = 0; aID < maxAgents; aID ++ ) {
    agentDat.position = MYFUNC.writeVec3(aID,agentDat.position,new THREE.Vector3(Math.random() * plotSize - plotSize / 2,Math.random() * plotSize - plotSize / 2,Math.random() * plotSize - plotSize / 2));
    agentDat.orientation = MYFUNC.writeVec3(aID,agentDat.orientation,new THREE.Vector3(Math.random() * plotSize - plotSize / 2,Math.random() * plotSize - plotSize / 2,Math.random() * plotSize - plotSize / 2).normalize());
  }
}


function init(){
  initGUI();
  agentInit();

  // Stats
  stats = new Stats();
  stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild( stats.dom );

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color( agentProp.BgC );
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.z = agentProp.SceneSize*1.5;

  // Bounding box
  helper = new THREE.BoxHelper( new THREE.Mesh( new THREE.BoxBufferGeometry( agentProp.SceneSize, agentProp.SceneSize, agentProp.SceneSize/2) ) );
  helper.material.color.setHex( 0xAAAAAA);
  helper.material.transparent = true;
  helper.name = "helper";
  helper.visible = true;
  scene.add( helper );

  // Renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild( renderer.domElement );

  // Geomtery
  group = new THREE.Group();
  scene.add( group );
  agents = new THREE.BufferGeometry();

  agents.setDrawRange( 0, numAgents );
  agents.setAttribute( 'position', new THREE.BufferAttribute( agentDat.position,3 ).setUsage( THREE.DynamicDrawUsage ) );
  agents.setAttribute( 'color', new THREE.BufferAttribute( agentDat.color,3).setUsage( THREE.DynamicDrawUsage ) );

  var aMaterial = new THREE.PointsMaterial( {
    size: 1,
    vertexColors: true,
    transparent: false,
    sizeAttenuation: true
  } );

  pointCloud = new THREE.Points( agents, aMaterial );
  group.add( pointCloud );

  linePositions = new Float32Array( maxAgents * 2 * 3 );
  lineColors = new Float32Array( maxAgents * 2 * 3 );

  geometry = new THREE.BufferGeometry();
  geometry.setAttribute( 'position', new THREE.BufferAttribute( linePositions, 3 ).setUsage( THREE.DynamicDrawUsage ) );
  geometry.setAttribute( 'color', new THREE.BufferAttribute( lineColors, 3 ).setUsage( THREE.DynamicDrawUsage ) );
  geometry.setDrawRange( 0, numAgents*2);

  var material = new THREE.LineBasicMaterial( {
    linewidth: 1,
    vertexColors: true,
  } );

  linesMesh = new THREE.LineSegments( geometry, material );
  group.add( linesMesh );
  pointCloud.visible = false;
}


// Update
function update () {

  if (runSim){
    var vertexpos = 0;
    var vertexcol = 0;
    var hit = false;

    agentDat = MYFUNC.agentSim(agentDat,agentProp);

    // Check for boundary and update size
    for( var aID = 0; aID < agentProp.NumAgents; aID ++ ){
      var x,y,z,newCol;
      x = Math.abs(agentDat.position[ aID * 3 ]);
      y = Math.abs(agentDat.position[ aID * 3 + 1 ]);
      z = Math.abs(agentDat.position[ aID * 3 + 2 ]);
      if (x > sceneHalf){
        agentDat.orientation[aID * 3] *= -1;
        agentDat.position[aID * 3] * agentDat.orientation[aID * 3];
        hit = true;
      }
      if (y > sceneHalf){
        agentDat.orientation[aID * 3 + 1] *= -1;
        agentDat.position[aID * 3 + 1] * agentDat.orientation[aID * 3 + 1];
        hit = true;
      }
      if (z > sceneHalf/2){
        agentDat.orientation[aID * 3 + 2] *= -1;
        agentDat.position[aID * 3 + 2] * agentDat.orientation[aID * 3 + 2];
        hit = true;
      }

      // Lines
      linePositions[ vertexpos++ ] = MYFUNC.point2line(agentDat.position[ aID * 3 ],agentDat.orientation[ aID * 3 ],lengthLine,true);
      linePositions[ vertexpos++ ] = MYFUNC.point2line(agentDat.position[ aID * 3+1],agentDat.orientation[ aID * 3+1],lengthLine,true);
      linePositions[ vertexpos++ ] = MYFUNC.point2line(agentDat.position[ aID * 3+2],agentDat.orientation[ aID * 3+2],lengthLine,true);

      linePositions[ vertexpos++ ] = MYFUNC.point2line(agentDat.position[ aID * 3 ],agentDat.orientation[ aID * 3 ],lengthLine,false);
      linePositions[ vertexpos++ ] = MYFUNC.point2line(agentDat.position[ aID * 3+1],agentDat.orientation[ aID * 3+1],lengthLine,false);
      linePositions[ vertexpos++ ] = MYFUNC.point2line(agentDat.position[ aID * 3+2],agentDat.orientation[ aID * 3+2],lengthLine,false);

      newCol = MYFUNC.rescale(agentDat.position[ aID * 3 + 2 ],-sceneHalf,sceneHalf,minCol,maxCol);
      lineColors[ vertexcol ++ ] = newCol;
      lineColors[ vertexcol ++ ] = newCol;
      lineColors[ vertexcol ++ ] = newCol;
      lineColors[ vertexcol ++ ] = newCol;
      lineColors[ vertexcol ++ ] = newCol;
      lineColors[ vertexcol ++ ] = newCol;
    }
  }

  helper.visible = boxVis;

  // Update points
  linesMesh.geometry.attributes.position.needsUpdate = true;
  linesMesh.geometry.attributes.color.needsUpdate = true;
  requestAnimationFrame( update );
  renderer.render( scene, camera );
  stats.end();
};

init();
update();
