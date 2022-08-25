//Random generators of higher quality
// Seed generator
export function xmur3(str) {
    for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
        h = h << 13 | h >>> 19;
    return function() {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

export function sfc32(a, b, c, d) {
    return function() {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      var t = (a + b) | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
}

export function genTriadsID(size){
  var list = [];
  for(var i1 = 0; i1 < size; i1 ++ ){
    for(var i2 = 0; i2 < size; i2 ++ ){
      for(var i3 = 0; i3 < size; i3 ++ ){
        list.push([i1,i2,i3])
      }
    }
  }
  return list;
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

export function nchoosek(n, k) {
  const result= [];
  const combos = [];
  const recurse = start => {
    if (combos.length + (n - start + 1) < k) { return }
    recurse(start + 1);
    combos.push(start);
    if(combos.length === k) {
       result.push(combos.slice());
    }else if(combos.length + (n - start + 2) >= k){
       recurse(start + 1);
    }
    combos.pop();
  }
  recurse(1, combos);
  return result;
}

export function nchoosek3(n) {
  var result = [];
  for (var i = 0; i < n.length; i ++ ) {
    result.push([n[i][0],n[i][1],n[i][2]]);
    result.push([n[i][1],n[i][2],n[i][0]]);
    result.push([n[i][2],n[i][0],n[i][1]]);
  }
  return result;
}

export function n3choosek(n, k) {
  const result= [];
  const combos = [];
  const recurse = start => {
    if (combos.length + (n - start + 1) < k) { return }
    recurse(start + 1);
    combos.push(start);
    if(combos.length === k) {
       result.push(combos.slice());
    }else if(combos.length + (n - start + 2) >= k){
       recurse(start + 1);
    }
    combos.pop();
  }
  recurse(1, combos);
  return result;
}

export function transpose(matrix) {
  return matrix[0].map((col, i) => matrix.map(row => row[i]));
}

export function zeros(y,x){
  return new Array(y).fill(0).map(() => new Array(x).fill(0));
}

export function randb(arrLength){
  var randomArray=[];
  for(let i = 0; i<arrLength; i++) {
    if (Math.random()<0.5){
        randomArray.push(0)
    }else{
        randomArray.push(1)
    }
  }
  return randomArray;
}

export function getSubID(){
	subID = makeID(3);
	console.info(datPath+subID+'.csv')
	for ( var i = 0; i < 10; i++ ) {
		if(fileExists(datPath+subID+'.csv')){
			subID = makeID(3);
		}else{
			break;
		}
	}
	return subID;
}

export function makeID(length) {
	var result           = '';
	var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var charactersLength = characters.length;
	for ( var i = 0; i < length; i++ ) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}


export function fileExists(fileLocation) {
	var response = $.ajax({
		url: fileLocation,
		type: 'HEAD',
		async: false
	}).status;
	if(response==404){
		return false;
	}else{
		return true;
	}
}

export function write2file(data,filename){
  $.ajax({
    type: 'POST',
    url: "write.php",
    data: {input:data,name:filename},
    success: function(result) {
      console.log('trial successfully sent to the server');
    }
  })
}

export function obj2csv(obj, useheader,opt) {
  if (typeof obj !== 'object') return null;
  opt = opt || {};
  var scopechar = opt.scopechar || '/';
  var delimeter = opt.delimeter || ',';
  if (Array.isArray(obj) === false) obj = [obj];
  var curs, name, rownum, key, queue, values = [], rows = [], headers = {}, headersArr = [];
  for (rownum = 0; rownum < obj.length; rownum++) {
    queue = [obj[rownum], ''];
    rows[rownum] = {};
    while (queue.length > 0) {
      name = queue.pop();
      curs = queue.pop();
      if (curs !== null && typeof curs === 'object') {
        for (key in curs) {
          if (curs.hasOwnProperty(key)) {
            queue.push(curs[key]);
            queue.push(name + (name ? scopechar : '') + key);
          }
        }
      } else {
        if (headers[name] === undefined) headers[name] = true;
        rows[rownum][name] = curs;
      }
    }
    values[rownum] = [];
  }
  // create csv text
  for (key in headers) {
    if (headers.hasOwnProperty(key)) {
      if (useheader){
        headersArr.push(key);
      }
      for (rownum = 0; rownum < obj.length; rownum++) {
        values[rownum].push(rows[rownum][key] === undefined
          ? ''
          : JSON.stringify(rows[rownum][key]));
        }
      }
    }
    for (rownum = 0; rownum < obj.length; rownum++) {
      values[rownum] = values[rownum].join(delimeter);
    }
    if (useheader){
      return '"' + headersArr.join('"' + delimeter + '"') + '"\n' + values.join('\n');
    }else{
      return '\n' + values.join('\n');
    }
  }
