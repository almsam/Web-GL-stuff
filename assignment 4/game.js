"use strict";

// vertex shader
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_MvpMatrix;
  varying vec3 v_Position;
  void main() {
    gl_Position = u_MvpMatrix * a_Position;
    v_Position = a_Position.xyz;
  }
`;

// frag shader

var FSHADER_SOURCE = `
  precision mediump float;
  varying vec3 v_Position;
  uniform vec3 u_BacteriaCenters[10];
  uniform float u_BacteriaRadii[10];
  uniform vec3 u_BacteriaColors[10];
  void main() {
    vec4 color = vec4(1.0, 1.0, 1.0, 1.0); // Default white grid
    for (int i = 0; i < 10; i++) {
      float dist = distance(v_Position, u_BacteriaCenters[i]);
      if (dist < u_BacteriaRadii[i] && u_BacteriaRadii[i] > 0.0) { // Only render bacteria with radius > 0
        color = vec4(u_BacteriaColors[i], 1.0);
        break; // end checking once a match is found
      }
    }
  gl_FragColor = color;
}
`;

// global vars for rotation (a3 q2)
var dragging = false; var lastX = 0, lastY = 0;
var rotationAngleX = 0, rotationAngleY = 0;
var modelMatrix = new Matrix4();

var bacteriaCenter = [0, 0, 1];
var bacteriaRadius = 0.05;

var bacteria = [];
var bacteriaToRemove = [];
var maxBacteria = 10;
var totalPoints = 0;

function updatePoints() {
  let pointsThisFrame = 0;

  for (let i = 0; i < bacteria.length; i++) {
    if (bacteriaToRemove.includes(i)) {
      continue;
    }

    let radiusChange = 0.0005; // grow r8
    let prevRadius = bacteria[i].radius;
    bacteria[i].radius = Math.min(1.0, bacteria[i].radius + radiusChange);
    let radiusDifference = bacteria[i].radius - prevRadius;

    // 1 point for each 0.1 rad
    pointsThisFrame += Math.floor(radiusDifference / 0.1);

    // bonus points if any bacteria reach radius of 1
    if (bacteria[i].radius === 1.0) {
      pointsThisFrame += 43;
    }

  }

  totalPoints += pointsThisFrame; // sum points to total
  console.log('Points this frame: ' + pointsThisFrame);
  console.log('Total points: ' + totalPoints);
}

function generateBacteria() {
  console.log('Generated Bacteria')
  for (let i = 0; i < maxBacteria; i++) {
    if(!bacteriaToRemove.includes(i)){
      bacteria.push({
        center: [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1],
        radius: 0.05,
        color: [Math.random(), Math.random(), Math.random()],
      });
    }
  }
}

function getClickedBacteriaIndex(x, y) {
  for (let i = 0; i < bacteria.length; i++) {
    let dx = bacteria[i].center[0] - x;
    let dy = bacteria[i].center[1] - y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    // console.log('dist: ' + distance + ' rad: ' + bacteria[i].radius)
    if (distance < bacteria[i].radius && bacteria[i].radius > 0.01) {
      console.log('got bacteria: ' + i)
      return i;
    }
  }
  return -1;
}

function main() {
  // link to HTML stuffs
  var canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return;
  }
  var gl = canvas.getContext('webgl');
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // initShaders 
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  generateBacteria();

  // lets make our sphere with grid lines
  // rad = 1.0, 30 lat bands, 30 long bands
  var sphereData = initSphere(1.0, 15, 20);

  // buffer of sphere vertices
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('failed to create the buffer object');
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.vertices), gl.STATIC_DRAW);

  // 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('failed to get the storage location of a_Position');
    return;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  //buffer w/ grid lines
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('failed to create the index buffer object');
    return;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereData.indices), gl.STATIC_DRAW);

  // clear color
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // black background
  gl.enable(gl.DEPTH_TEST);

//   // perspective stuff:
//   var mvpMatrix = new Matrix4();
//   mvpMatrix.setPerspective(45, canvas.width/canvas.height, 0.1, 100);
//   mvpMatrix.lookAt(3, 3, 3, 0, 0, 0, 0, 1, 0);

  canvas.onmousedown = function(ev) {
    dragging = true;
    lastX = ev.clientX;
    lastY = ev.clientY;
  };
  canvas.onmouseup = function(ev) {
    dragging = false;
  };
  canvas.onmousemove = function(ev) {
    if (dragging) {
      var dx = ev.clientX - lastX;
      var dy = ev.clientY - lastY;
      // increment rotation angles
      rotationAngleY += dx * 0.5; //sensitivity
      rotationAngleX += dy * 0.5; //sensitivity
      lastX = ev.clientX;
      lastY = ev.clientY;
    }
  };

  // get the storage location of our perspective matrix
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!u_MvpMatrix) {
    console.log('could nt get the storage location of u_MvpMatrix');
    return;
  }



  var u_BacteriaCenter = gl.getUniformLocation(gl.program, "u_BacteriaCenter");
  var u_BacteriaRadius = gl.getUniformLocation(gl.program, "u_BacteriaRadius");


//   gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

//   // clear color & draw the grid lines on sphere
//   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

//   gl.drawElements(gl.LINES, sphereData.indices.length, gl.UNSIGNED_SHORT, 0);

// function render() {
//     // model-view-proj (MVP) matrix: Projection * View * Model
//     var mvpMatrix = new Matrix4();
//     mvpMatrix.setPerspective(45, canvas.width / canvas.height, 0.1, 100);
//     mvpMatrix.lookAt(3, 3, 3, 0, 0, 0, 0, 1, 0);
    
//     // update the model matrix based on drag rotations
//     modelMatrix.setIdentity();
//     modelMatrix.rotate(rotationAngleX, 1, 0, 0);
//     modelMatrix.rotate(rotationAngleY, 0, 1, 0);
    
//     // mvpMatrix = Projection * View * Model //multiply it
//     mvpMatrix.multiply(modelMatrix);
    
//     // pass final MVP matrix to the shader
//     gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

//     gl.uniform3fv(u_BacteriaCenter, bacteriaCenter);
//     gl.uniform1f(u_BacteriaRadius, bacteriaRadius);
    
//     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
//     gl.drawElements(gl.LINES, sphereData.indices.length, gl.UNSIGNED_SHORT, 0);

//     bacteriaRadius += 0.0005; // Increase bacteria growth over time
//     requestAnimationFrame(render);

//   }
  
//   requestAnimationFrame(render);


  var u_MvpMatrix = gl.getUniformLocation(gl.program, "u_MvpMatrix");
  var u_BacteriaCenters = gl.getUniformLocation(gl.program, "u_BacteriaCenters");
  var u_BacteriaRadii = gl.getUniformLocation(gl.program, "u_BacteriaRadii");
  var u_BacteriaColors = gl.getUniformLocation(gl.program, "u_BacteriaColors");

  function render() {
    var mvpMatrix = new Matrix4();
    mvpMatrix.setPerspective(45, canvas.width / canvas.height, 0.1, 100);
    mvpMatrix.lookAt(3, 3, 3, 0, 0, 0, 0, 1, 0);

    modelMatrix.setIdentity();
    modelMatrix.rotate(rotationAngleX, 1, 0, 0);
    modelMatrix.rotate(rotationAngleY, 0, 1, 0);

    mvpMatrix.multiply(modelMatrix);

    // pass final MVP matrix to the shader
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    gl.uniform3fv(u_BacteriaCenter, bacteriaCenter);
    gl.uniform1f(u_BacteriaRadius, bacteriaRadius);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.LINES, sphereData.indices.length, gl.UNSIGNED_SHORT, 0);

//     bacteriaRadius += 0.0005; // Increase bacteria growth over time
    
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    var centers = [], radii = [], colors = [];
    // for (let i = 0; i < maxBacteria; i++) {
    for (let i = 0; i < bacteria.length; i++) {

      if (bacteriaToRemove.includes(i)) {
        console.log('Deleted bacteria array: ' + bacteriaToRemove);

        bacteria[i].radius = 0;

        centers.push(...bacteria[i].center);
        radii.push(bacteria[i].radius);
        colors.push(...bacteria[i].color);

        // bacteria.splice(i, 1);
        // bacteriaToRemove = bacteriaToRemove.filter(index => index !== i);
        // i--;

      } else {
        centers.push(...bacteria[i].center);
        radii.push(bacteria[i].radius);
        colors.push(...bacteria[i].color);
        // bacteria[i].radius += 0.0005; // grow rate
        bacteria[i].radius = Math.min(1, bacteria[i].radius + 0.0005);
      }

    }
    
    gl.uniform3fv(u_BacteriaCenters, new Float32Array(centers));
    gl.uniform1fv(u_BacteriaRadii, new Float32Array(radii));
    gl.uniform3fv(u_BacteriaColors, new Float32Array(colors));
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.LINES, sphereData.indices.length, gl.UNSIGNED_SHORT, 0);

    updatePoints();
    requestAnimationFrame(render);
  }

  canvas.addEventListener("click", function(event) {
    // console.log('detected click ');
    var rect = canvas.getBoundingClientRect();
    var x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    var y = -(((event.clientY - rect.top) / canvas.height) * 2 - 1);
    var clickedIndex = getClickedBacteriaIndex(x, y);
    console.log('    click: ' + clickedIndex);
    if (clickedIndex !== -1) {
      // bacteria.splice(clickedIndex, 1);
      if (!bacteriaToRemove.includes(clickedIndex)) {
        bacteriaToRemove.push(clickedIndex)
      }
      // bacteriaToRemove.push(clickedIndex);
      // console.log('detected bacteria ' + clickedIndex);
    }
  });

  requestAnimationFrame(render);

}

// now lest generate the sphere vertex positions and grid lines
//our sphere is defined by radius, & the number of latBands n longBands
function initSphere(radius, latBands, longBands) {
  var vertices = [];
  var indices = [];

  // generate vertices.
  for (var latNumber = 0; latNumber <= latBands; latNumber++) {
    var theta = latNumber * Math.PI / latBands;
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);

    for (var longNumber = 0; longNumber <= longBands; longNumber++) {
      var phi = longNumber * 2 * Math.PI / longBands;
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);

      var x = cosPhi * sinTheta;
      var y = cosTheta;
      var z = sinPhi * sinTheta;
      vertices.push(radius * x);
      vertices.push(radius * y);
      vertices.push(radius * z);
    }
  }

  // generate indices - draw lines along lat n long
  for (var latNumber = 0; latNumber < latBands; latNumber++) {
    for (var longNumber = 0; longNumber < longBands; longNumber++) {
      var first = (latNumber * (longBands + 1)) + longNumber;
      var second = first + longBands + 1;

      indices.push(first);
      indices.push(first + 1);

      indices.push(first);
      indices.push(second);
    }
  }

  return {
    vertices: vertices,
    indices: indices
  };
}

// run main() when the page runs
window.onload = main;
