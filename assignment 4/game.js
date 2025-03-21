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
  uniform vec3 u_BacteriaCenter;
  uniform float u_BacteriaRadius;
  void main() {
    float dist = distance(v_Position, u_BacteriaCenter);
    if (dist < u_BacteriaRadius) {
      gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); // green bacteria
    } else {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // white grid // white grid lines
    }
  }
`;

// global vars for rotation (a3 q2)
var dragging = false; var lastX = 0, lastY = 0;
var rotationAngleX = 0, rotationAngleY = 0;
var modelMatrix = new Matrix4();

var bacteriaCenter = [0, 0, 1];
var bacteriaRadius = 0.05;

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

function render() {
    // model-view-proj (MVP) matrix: Projection * View * Model
    var mvpMatrix = new Matrix4();
    mvpMatrix.setPerspective(45, canvas.width / canvas.height, 0.1, 100);
    mvpMatrix.lookAt(3, 3, 3, 0, 0, 0, 0, 1, 0);
    
    // update the model matrix based on drag rotations
    modelMatrix.setIdentity();
    modelMatrix.rotate(rotationAngleX, 1, 0, 0);
    modelMatrix.rotate(rotationAngleY, 0, 1, 0);
    
    // mvpMatrix = Projection * View * Model //multiply it
    mvpMatrix.multiply(modelMatrix);
    
    // pass final MVP matrix to the shader
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    gl.uniform3fv(u_BacteriaCenter, bacteriaCenter);
    gl.uniform1f(u_BacteriaRadius, bacteriaRadius);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.LINES, sphereData.indices.length, gl.UNSIGNED_SHORT, 0);

    bacteriaRadius += 0.002; // Increase bacteria growth over time
    requestAnimationFrame(render);

  }
  
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
