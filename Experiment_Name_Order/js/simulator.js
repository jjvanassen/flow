
import * as THREE from '/js/three.module.js';
var once = true;

// Support functions
function writeVec3(ID,array,vector) {
  array[ ID * 3 ] = vector.x;
  array[ ID * 3 + 1 ] = vector.y;
  array[ ID * 3 + 2 ] = vector.z;
  return array;
}

function readVec3(ID,array) {
  var x,y,z;
  x = array[ ID * 3 ];
  y = array[ ID * 3 + 1 ];
  z = array[ ID * 3 + 2 ];
  return new THREE.Vector3(x,y,z);
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

function addMatrices(matrixA,matrixB){
  var newMat3 = new THREE.Matrix3();
  var newMat = [];
  var matA = matrixA.toArray();
  var matB = matrixB.toArray();
  for ( var i = 0; i < matA.length; i ++ ) {
    newMat[i]=matA[i]+matB[i];
  }
  return newMat3.fromArray(newMat);
}

function point2line(position,orientation,length,start){
  var out;
  if (start){
    out = position+(orientation*(length/2));
  }else{
    out = position-(orientation*(length/2));
  }
  return out;
}

function rescale(value,minIn,maxIn,minOut,maxOut) {
  var diffIn = maxIn-minIn;
  var diffOut = maxOut-minOut;
  var valueTemp = value-minIn;
  valueTemp = valueTemp/diffIn;
  valueTemp = valueTemp*diffOut;
  var valueOut = valueTemp+minOut;
  return valueOut;
}

function norm(Vec3){
  var result = 0;
  var inVec = [];
  inVec[0] = Vec3.x;
  inVec[1] = Vec3.y;
  inVec[2] = Vec3.z;
  for ( var i = 0; i < inVec.length; i ++ ) {
    result += Math.pow(inVec[i],2);
  }
  return Math.sqrt(result);
}

//Randomize array in-place using Durstenfeld shuffle algorithm
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

// rand array for informedness
function randArray(numAgents,numIndex){
  var outArray = [];
  var arrayShuffled = Array(numAgents).fill().map((element, index) => index)
  arrayShuffled = shuffleArray(arrayShuffled)
  for ( var i = 0; i < numIndex; i ++ ) {
    outArray[i] = arrayShuffled[i];
  }
  return outArray;
}

// Functions used for simulation
function cleanNextStepDat(sceneProp){
  var nextStepDat = [];
  var totZoR = [],totZoO = [],totZoA = [],cntZoR = [],cntZoO = [],cntZoA = [];
  for ( var aID = 0; aID < sceneProp.NumAgents; aID ++ ) {
    totZoR[aID] = new THREE.Vector3();
    totZoO[aID] = new THREE.Vector3();
    totZoA[aID] = new THREE.Vector3();
    cntZoR[aID] = 0;
    cntZoO[aID] = 0;
    cntZoA[aID] = 0;
  }
  nextStepDat.totZoR = totZoR;
  nextStepDat.totZoO = totZoO;
  nextStepDat.totZoA = totZoA;
  nextStepDat.cntZoR = cntZoR;
  nextStepDat.cntZoO = cntZoO;
  nextStepDat.cntZoA = cntZoA;
  return nextStepDat;
}

function rotateTo(oldDir,newDir,rad){
  var A = new THREE.Matrix3();
  var R1 = new THREE.Matrix3();
  var R2 = new THREE.Matrix3();
  var R3 = new THREE.Matrix3();
  var R = new THREE.Matrix3();
  var x = new THREE.Vector3();
  x.crossVectors(oldDir,newDir);
  var xNorm = norm(x);
  if (xNorm < 1e-15){
    return oldDir;
  } else {
    x.divideScalar(xNorm);
    A.set(0,-x.z,x.y,x.z,0,-x.x,-x.y,x.x,0);
    var c = Math.cos(rad);
    var s = Math.sin(rad);
    R1.identity();
    R2.copy(A).multiplyScalar(s);
    R3.multiplyMatrices(A,A).multiplyScalar(1-c);
    // Three.js doesn't support the addition of matrices
    R = addMatrices(R1,addMatrices(R2,R3));
  }
  return oldDir.applyMatrix3(R);
}

// Calculate angle noise
export function noiseA(dir,errA){
  var tempSphere = new THREE.Spherical;
  tempSphere.setFromVector3(dir);
  tempSphere.radius = 1;
  tempSphere.phi += errA * (2 * Math.random() - 1);
  tempSphere.theta += errA * (2 * Math.random() - 1);
  return dir.setFromSpherical(tempSphere);
}

// Functions called for the trial
export function simInit(sceneProp){
  // Variables
  var numAgents = sceneProp.NumAgents;
  var maxAgents = numAgents;
  var plotSize = sceneProp.SceneSize / 10;

  // Setup agent data and property structures
  var agentDat = [];

  // Setup scene and camera
  var scene = new THREE.Scene();
  scene.background = new THREE.Color( sceneProp.BgC );
  //scene.background = new THREE.Color( '#404040' );

  var fovcam = 43;
  var aspect = 1;
  var near = 0.1;
  var far = sceneProp.SceneSize*3;
  var camera = new THREE.PerspectiveCamera(fovcam, aspect, near, far);
  camera.position.set(0, 0, sceneProp.SceneSize*1.78);

  // Initialize agentDat
  //var informed = randArray(numAgents,Math.round(numAgents*sceneProp.Informed));
  //var informed = randArray(numAgents,Math.round(numAgents));
  var posArray = new Float32Array( maxAgents * 3 );
  var orArray = new Float32Array( maxAgents * 3 );
  //var infArray = new Float32Array( maxAgents);
  for ( var aID = 0; aID < maxAgents; aID ++ ) {
    // Position assignment
    var vecIn = new THREE.Vector3(Math.random() * plotSize - plotSize / 2,Math.random() * plotSize - plotSize / 2,Math.random() * plotSize - plotSize / 2);
    posArray = writeVec3(aID,posArray,vecIn);
    // Orientation assignment
    var vecIn = new THREE.Vector3(Math.random() - 1 / 2,Math.random() - 1 / 2,Math.random() - 1 / 2).normalize();
    orArray = writeVec3(aID,orArray,vecIn);
    // Informed assignment
    //if (informed.includes(aID)){
    //  infArray[ aID ] = Math.random()/sceneProp.InformedFactor;
    //}else{
    //  infArray[ aID ] = 0.;
    //}
  }
  agentDat.position = posArray;
  agentDat.orientation = orArray;
  //agentDat.informedness = infArray;

  // bounding box
  var helper = new THREE.BoxHelper( new THREE.Mesh( new THREE.BoxBufferGeometry( sceneProp.SceneSize, sceneProp.SceneSize, sceneProp.SceneSize) ) );
  helper.material.color.setHex( 0x404040);
  helper.material.blending = THREE.AdditiveBlending;
  helper.material.transparent = true;
  helper.name = "helper";
  scene.add( helper );

  // lines
  var linePositions = new Float32Array( sceneProp.NumAgents * 2 * 3 );
  var lineColors = new Float32Array( sceneProp.NumAgents * 2 * 3 );

  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute( 'position', new THREE.BufferAttribute(linePositions, 3 ).setUsage( THREE.DynamicDrawUsage));
  geometry.setAttribute( 'color', new THREE.BufferAttribute( lineColors, 3 ).setUsage( THREE.DynamicDrawUsage ));
  geometry.setDrawRange( 0, sceneProp.NumAgents*2);
  var lMaterial = new THREE.LineBasicMaterial( {
    vertexColors: true
  });

  var lines = new THREE.LineSegments( geometry, lMaterial );
  lines.name = "lines";
  scene.add( lines );

  return [scene, camera, agentDat, sceneProp];
}

export function resetAgents(agentDat,sceneProp){
  var maxAgents = sceneProp.NumAgents;
  var plotSize = sceneProp.SceneSize / 10;
  for ( var aID = 0; aID < maxAgents; aID ++ ) {
    agentDat.position = writeVec3(aID,agentDat.position,new THREE.Vector3(Math.random() * plotSize - plotSize / 2,Math.random() * plotSize - plotSize / 2,Math.random() * plotSize - plotSize / 2));
    agentDat.orientation = writeVec3(aID,agentDat.orientation,new THREE.Vector3(Math.random() * plotSize - plotSize / 2,Math.random() * plotSize - plotSize / 2,Math.random() * plotSize - plotSize / 2).normalize());
  }
  return agentDat;
}

export function simUpdate(agentDat,sceneProp){
  // Clear dataset for next step
  var nextStepDat = cleanNextStepDat(sceneProp);
  // other constants
  var angleA,angleN;
  var fov = deg2rad(sceneProp.FoV);
  var turn = deg2rad(sceneProp.Turn);//asuming 60fps
  var zor = sceneProp.ZoR;
  var zoo = sceneProp.ZoR+sceneProp.ZoO;
  var zoa = sceneProp.ZoR+sceneProp.ZoO+sceneProp.ZoA;
  var aSpeed = sceneProp.Speed;
  var errA = sceneProp.Error;
  //var informed = sceneProp.Informed;

  if (once){
    console.info(sceneProp);
    once = false;
  }


/*
  // calculate new test (mean location)
  if (informed>0){
    var meanX=0;
    var meanY=0;
    var meanZ=0;
    for ( var aID = 0; aID < sceneProp.NumAgents; aID ++ ) {
      meanX = meanX+agentDat.position[ aID * 3 ];
      meanY = meanY+agentDat.position[ aID * 3 + 1 ];;
      meanZ = meanZ+agentDat.position[ aID * 3 + 2 ];;
    }
    sceneProp.RoI.set(meanX/sceneProp.NumAgents,meanY/sceneProp.NumAgents,meanZ/sceneProp.NumAgents);

  }*/

  // calculate zones
  for ( var aID = 0; aID < sceneProp.NumAgents; aID ++ ) {
    for ( var nID = aID+1; nID < sceneProp.NumAgents; nID ++ ) {
      var angleA,angleN;
      var aPos = readVec3(aID,agentDat.position);
      var aDir = readVec3(aID,agentDat.orientation);
      var nPos = readVec3(nID,agentDat.position);
      var nDir = readVec3(nID,agentDat.orientation);
      var diffVec = nPos.sub(aPos);
      var dist = diffVec.length();

      // Zone of repulsion
      if (dist <= zor){
        diffVec.normalize();
        nextStepDat.totZoR[aID].sub(diffVec).normalize();
        nextStepDat.totZoR[nID].add(diffVec).normalize();
        nextStepDat.cntZoR[aID]++;
        nextStepDat.cntZoR[nID]++;

        // Zone of orientation
      } else if (dist > zor && dist <= zoo){
        aDir.normalize();
        nDir.normalize();
        diffVec.normalize();
        angleA = diffVec.angleTo(aDir);
        angleN = diffVec.negate().angleTo(nDir);
        // Check if visible
        if (angleA<fov){
          nextStepDat.totZoO[aID].add(nDir).normalize();
          nextStepDat.cntZoO[aID]++;
        }
        if (angleN<fov){
          nextStepDat.totZoO[nID].add(aDir).normalize();
          nextStepDat.cntZoO[nID]++;
        }

        // Zone of attraction
      } else if (dist > zoo && dist <= zoa){
        aDir.normalize();
        diffVec.normalize();
        angleA = diffVec.angleTo(aDir);
        angleN = diffVec.negate().angleTo(nDir);
        // Check if visible
        if (angleA<fov){
          nextStepDat.totZoA[aID].sub(diffVec).normalize();;
          nextStepDat.cntZoA[aID]++;
        }
        if (angleN<fov){
          nextStepDat.totZoA[nID].add(diffVec).normalize();;
          nextStepDat.cntZoA[nID]++;
        }
      }
    }
  }

  // Loop to apply velocities
  for( var aID = 0; aID < sceneProp.NumAgents; aID ++ ){
    var aPos = readVec3(aID,agentDat.position);
    var aDir = readVec3(aID,agentDat.orientation);
    var newPos = new THREE.Vector3();
    var newDir = new THREE.Vector3();

    // zone of repulsion
    if (nextStepDat.cntZoR[aID] > 0){
      // check max turning angle
      var angleCheck = aDir.angleTo(nextStepDat.totZoR[aID]);
      if(angleCheck > turn){
        newDir = rotateTo(aDir,nextStepDat.totZoR[aID],turn)
      }else{
        newDir = nextStepDat.totZoR[aID];
      }

      // zone of orientation
    } else if (nextStepDat.cntZoO[aID] > 0 && nextStepDat.cntZoA[aID] == 0){
      // check max turning angle
      var angleCheck = aDir.angleTo(nextStepDat.totZoO[aID]);
      if(angleCheck > turn){
        newDir = rotateTo(aDir,nextStepDat.totZoO[aID],turn)
      }else{
        newDir = nextStepDat.totZoO[aID];
      }

      // zone of attraction
    } else if (nextStepDat.cntZoO[aID] == 0 && nextStepDat.cntZoA[aID] > 0){
      // check max turning angle
      var angleCheck = aDir.angleTo(nextStepDat.totZoA[aID]);
      if(angleCheck > turn){
        newDir = rotateTo(aDir,nextStepDat.totZoA[aID],turn)
      }else{
        newDir = nextStepDat.totZoA[aID];
      }

      // zone of orientation & attraction
    } else if (nextStepDat.cntZoO[aID] > 0 && nextStepDat.cntZoA[aID] > 0){
      // check max turning angle
      newDir.addVectors(nextStepDat.totZoO[aID],nextStepDat.totZoA[aID]).normalize();
      var angleCheck = aDir.angleTo(newDir);
      if(angleCheck > turn){
        newDir = rotateTo(aDir,newDir,turn);
        newDir.normalize();
      }

      // No zone
    } else {
      newDir = aDir;
    }

/*
    // Apply informedness
    if (agentDat.informedness[aID]>0){
      var diffVec = agentProp.RoI.sub(aPos);
      newDir.add(diffVec.normalize().multiplyScalar(agentDat.informedness[aID]))
      newDir.normalize();
    }*/

    // apply noiseA
    newDir = noiseA(newDir,errA).normalize();
    // Calculate new coordinates
    newPos = aPos.add(newDir.multiplyScalar(aSpeed));

    // Check boundaries
    if (Math.abs(newPos.x) > sceneProp.SceneSize/2){
      newDir.x *= -1;
    }
    if (Math.abs(newPos.y) > sceneProp.SceneSize/2){
      newDir.y *= -1;
    }
    // not go to deep
    //if (Math.abs(newPos.z) > sceneProp.SceneSize/2){
    if (newPos.z < 0 || newPos.z > sceneProp.SceneSize/2){
      newDir.z *= -1;
    }
    // Assign new orientation and position
    agentDat.position = writeVec3(aID,agentDat.position,newPos)
    agentDat.orientation = writeVec3(aID,agentDat.orientation,newDir.normalize())
  }
  return agentDat
}

export function lineUpdate(scene,agentDat,sceneProp){
  var lines = scene.getObjectByName("lines")
  var helper = scene.getObjectByName("helper")
  var linePositions = lines.geometry.attributes.position.array;
  var lineColors = lines.geometry.attributes.color.array;
  var vertexpos = 0;
  var vertexcol = 0;

  for( var aID = 0; aID < sceneProp.NumAgents; aID ++ ){
    var newCol;

    // Lines
    linePositions[ vertexpos++ ] = point2line(agentDat.position[ aID * 3 ],agentDat.orientation[ aID * 3 ],sceneProp.LengthLine,true);
    linePositions[ vertexpos++ ] = point2line(agentDat.position[ aID * 3+1],agentDat.orientation[ aID * 3+1],sceneProp.LengthLine,true);
    linePositions[ vertexpos++ ] = point2line(agentDat.position[ aID * 3+2],agentDat.orientation[ aID * 3+2],sceneProp.LengthLine,true);

    linePositions[ vertexpos++ ] = point2line(agentDat.position[ aID * 3 ],agentDat.orientation[ aID * 3 ],sceneProp.LengthLine,false);
    linePositions[ vertexpos++ ] = point2line(agentDat.position[ aID * 3+1],agentDat.orientation[ aID * 3+1],sceneProp.LengthLine,false);
    linePositions[ vertexpos++ ] = point2line(agentDat.position[ aID * 3+2],agentDat.orientation[ aID * 3+2],sceneProp.LengthLine,false);

    // colors
    newCol = rescale(agentDat.position[ aID * 3 + 2 ],-sceneProp.SceneSize/2,sceneProp.SceneSize/2,sceneProp.ColMin,1);
    lineColors[ vertexcol ++ ] = newCol;
    lineColors[ vertexcol ++ ] = newCol;
    lineColors[ vertexcol ++ ] = newCol;
    lineColors[ vertexcol ++ ] = newCol;
    lineColors[ vertexcol ++ ] = newCol;
    lineColors[ vertexcol ++ ] = newCol;
  }
  // visual guides
    helper.visible = true;

  lines.geometry.attributes.position.needsUpdate = true;
  lines.geometry.attributes.color.needsUpdate = true;
  return agentDat;
}
