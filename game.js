// get WebGL context
const canvas = document.getElementById("gameCanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
    console.error("WebGL not supported!");
}

// vertex shade prog
const vertexShaderSource = `
    attribute vec2 a_Position;
    void main() {
        gl_Position = vec4(a_Position, 0.0, 1.0);
    }
`;

// fragment shader program
const fragmentShaderSource = `
    precision mediump float;
    uniform vec2 u_Center;
    uniform float u_Radius;

    void main() {
        vec2 coord = gl_FragCoord.xy / 300.0 - vec2(1.0, 1.0); // Normalize to (-1, 1)
        float dist = distance(coord, u_Center);
        if (dist < u_Radius) {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // White color for the circle
        } else {
            discard; // Black outside the circle
        }
    }
`;

// compile & create shader
function compileShader(gl, sourceCode, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

// link js program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
}
gl.useProgram(program);

// Setup field (a square)
const vertices = new Float32Array([
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
     1.0,  1.0
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const aPosition = gl.getAttribLocation(program, "a_Position");
gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPosition);

// uniforms
const uCenter = gl.getUniformLocation(program, "u_Center");
const uRadius = gl.getUniformLocation(program, "u_Radius");
gl.uniform2f(uCenter, 0.0, 0.0); // Center of the circle
gl.uniform1f(uRadius, 0.8); // Radius of the circle

// make scene
gl.clearColor(0.0, 0.0, 0.0, 1.0); // Black background
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
