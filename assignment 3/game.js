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

}