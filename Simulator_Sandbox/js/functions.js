import * as THREE from './three.module.js';

export function writeVec3(ID,array,vector) {
  array[ ID * 3 ] = vector.x;
  array[ ID * 3 + 1 ] = vector.y;
  array[ ID * 3 + 2 ] = vector.z;
  return array;
}

export function readVec3(ID,array) {
  var x,y,z;
  x = array[ ID * 3 ];
  y = array[ ID * 3 + 1 ];
  z = array[ ID * 3 + 2 ];
  return new THREE.Vector3(x,y,z);
}

// Rescale values
export function rescale(value, minIn, maxIn, minOut, maxOut) {
  var diffIn = maxIn-minIn;
  var diffOut = maxOut-minOut;
  var valueTemp = value-minIn;
  valueTemp = valueTemp/diffIn;
  valueTemp = valueTemp*diffOut;
  var valueOut = valueTemp+minOut;
  return valueOut;
}

export function deg2rad(deg) {
  return deg * (Math.PI/180);
}

export function rad2deg(rad) {
  return rad * (180/Math.PI);
}

export function arr2vec3(arr) {
  return new THREE.Vector3(arr[0],arr[1],arr[2]);
}

export function vec32arr(vec3) {
  return new Float32Array([vec3.x,vec3.y,vec3.z]);
}

export function point2line(position,orientation,length,start){
  var out;
  if (start){
    out = position+(orientation*(length/2));
  }else{
    out = position-(orientation*(length/2));
  }
  return out;
}

export function norm(Vec3){
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

export function randArray(numAgents,numIndex){
  var outArray = [];
  var arrayShuffled = Array(numAgents).fill().map((element, index) => index)
  arrayShuffled = shuffleArray(arrayShuffled)
  for ( var i = 0; i < numIndex; i ++ ) {
    outArray[i] = arrayShuffled[i];
  }
  return outArray;
}

//Randomize array in-place using Durstenfeld shuffle algorithm
export function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

export function noiseA(dir,errA){
  var tempSphere = new THREE.Spherical;
  tempSphere.setFromVector3(dir);
  tempSphere.radius = 1;
  tempSphere.phi += errA * (2 * Math.random() - 1);
  tempSphere.theta += errA * (2 * Math.random() - 1);
  return dir.setFromSpherical(tempSphere);
}

export function noiseS(errS){
  return errS * (2 * Math.random() - 1)
}

export function addMatrices(matrixA,matrixB){
  var newMat3 = new THREE.Matrix3();
  var newMat = [];
  var matA = matrixA.toArray();
  var matB = matrixB.toArray();
  for ( var i = 0; i < matA.length; i ++ ) {
    newMat[i]=matA[i]+matB[i];
  }
  return newMat3.fromArray(newMat);
}

export function rotateTo(oldDir,newDir,rad){
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

export function cleanNextStepDat(agentProp){
  var nextStepDat = [];
  var totZoR = [],totZoO = [],totZoA = [],cntZoR = [],cntZoO = [],cntZoA = [];
  for ( var aID = 0; aID < agentProp.NumAgents; aID ++ ) {
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

export function agentSim(agentDat, agentProp){
  // Clear dataset for next step
  var nextStepDat = cleanNextStepDat(agentProp);
  // other constants
  var angleA,angleN;
  var fov = deg2rad(agentProp.FoV);
  var turn = deg2rad(agentProp.Turn/60);//asuming 60fps
  var errA = deg2rad(agentProp.ErrorAngle);
  var errS = deg2rad(agentProp.ErrorSpeed);
  var zor = agentProp.ZoR;
  var zoo = agentProp.ZoR+agentProp.ZoO;
  var zoa = agentProp.ZoR+agentProp.ZoO+agentProp.ZoA;


  for ( var aID = 0; aID < agentProp.NumAgents; aID ++ ) {
    for ( var nID = aID+1; nID < agentProp.NumAgents; nID ++ ) {
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
        nextStepDat.totZoR[aID].sub(diffVec).normalize();;
        nextStepDat.totZoR[nID].add(diffVec).normalize();;
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
  for( var aID = 0; aID < agentProp.NumAgents; aID ++ ){
    var aPos = readVec3(aID,agentDat.position);
    var aDir = readVec3(aID,agentDat.orientation);
    var newPos = new THREE.Vector3();
    var newDir = new THREE.Vector3();
    var aSpeed = agentProp.Speed;

    // zone of repulsion
    if (nextStepDat.cntZoR[aID] > 0){
      // check max turning angle
      var angleCheck = aDir.angleTo(nextStepDat.totZoR[aID]);
      if(angleCheck > turn){
        newDir = rotateTo(aDir,nextStepDat.totZoR[aID],turn)
      }else{
        newDir = nextStepDat.totZoR[aID];
      }
      // apply noiseA
      newDir = noiseA(newDir,errA)

      // zone of orientation
    } else if (nextStepDat.cntZoO[aID] > 0 && nextStepDat.cntZoA[aID] == 0){
      // check max turning angle
      var angleCheck = aDir.angleTo(nextStepDat.totZoO[aID]);
      if(angleCheck > turn){
        newDir = rotateTo(aDir,nextStepDat.totZoO[aID],turn)
      }else{
        newDir = nextStepDat.totZoO[aID];
      }
      // apply noiseA
      newDir = noiseA(newDir,errA)

      // zone of attraction
    } else if (nextStepDat.cntZoO[aID] == 0 && nextStepDat.cntZoA[aID] > 0){
      // check max turning angle
      var angleCheck = aDir.angleTo(nextStepDat.totZoA[aID]);
      if(angleCheck > turn){
        newDir = rotateTo(aDir,nextStepDat.totZoA[aID],turn)
      }else{
        newDir = nextStepDat.totZoA[aID];
      }
      // apply noiseA
      newDir = noiseA(newDir,errA)

      // zone of orientation & attraction
    } else if (nextStepDat.cntZoO[aID] > 0 && nextStepDat.cntZoA[aID] > 0){
      // check max turning angle
      newDir.addVectors(nextStepDat.totZoO[aID],nextStepDat.totZoA[aID]).normalize();
      var angleCheck = aDir.angleTo(newDir);
      if(angleCheck > turn){
        newDir = rotateTo(aDir,newDir,turn);
        newDir.normalize();
      }
      // apply noiseA
      newDir = noiseA(newDir,errA);

      // No zone
    } else {
      newDir = noiseA(aDir,errA);
    }

    // Apply informedness
    if (agentDat.informedness[aID]>0){
      var diffVec = agentProp.RoI.sub(aPos);
      newDir.add(diffVec.normalize().multiplyScalar(agentDat.informedness[aID]))
      newDir.normalize();
    }

    // Calculate new coordinates
    newPos = aPos.add(newDir.multiplyScalar(aSpeed+noiseS(errS)));
    // Assign new orientation and position
    agentDat.position = writeVec3(aID,agentDat.position,newPos)
    agentDat.orientation = writeVec3(aID,agentDat.orientation,newDir.normalize())
  }
  return agentDat
}
