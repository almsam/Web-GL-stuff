// Growing Square
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_SizeChange;\n' +
  'void main() {\n' +
  '  gl_Position.x = u_SizeChange * a_Position.x;\n' +
  '  gl_Position.y = u_SizeChange * a_Position.y;\n' +
  '  gl_Position.z = u_SizeChange * a_Position.z;\n' +
  '  gl_Position.w = 1.0;\n' +
  '}\n';
  
// Fragment shader program
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
  '}\n';

// Growing rate (size change/second)
var GROWING_RATE = 0.1;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Write the positions of vertices to a vertex shader
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }
  
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
  // Get storage location of u_SizeChange
  var u_SizeChange = gl.getUniformLocation(gl.program, 'u_SizeChange');
  if (!u_SizeChange) { 
    console.log('Failed to get the storage location of u_SizeChange');
    return;
  }

  // Current size
  var currentSize = 1.0;

  // Start drawing
  var tick = function() {
    currentSize = animate(currentSize);  // Update the size
    draw(gl, n, currentSize, u_SizeChange);   // Draw the square
    requestAnimationFrame(tick, canvas); // Request that the browser calls tick
  };
  tick();
}

function initVertexBuffers(gl) {
  var vertices = new Float32Array([
    -0.25, 0.25,   -0.25, -0.25,   0.25, 0.25,　0.25, -0.25
  ]);
  var n = 4; // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Assign the buffer object to a_Position variable
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  return n;
}

function draw(gl, n, currentSize,u_SizeChange) {
  // Pass the changed size to the vertex shader
  gl.uniform1f(u_SizeChange, currentSize);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw the rectangle
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
}

// Last time that this function was called
var g_last = Date.now();
function animate(size) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current size (adjusted by the elapsed time)
  var newSize = size + (GROWING_RATE * elapsed) / 1000.0;
  return newSize;
}
