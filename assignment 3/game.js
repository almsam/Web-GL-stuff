"use strict";

// vertex shader
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  gl_PointSize = 4.0;\n' +
  '}\n';

// frag shader
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n' +  // white grid lines
  '}\n';

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
  var sphereData = initSphere(1.0, 30, 30);

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
}