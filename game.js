// get WebGL context
const canvas = document.getElementById("gameCanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
    console.error("WebGL not supported!");
}

const bacteriaCount = 22; // number of enemies
const bacteria = [];
const bacteriaColors = [];

function randomHueToRGB(hue) {
    const f = (n) => Math.abs(((n * 6 + hue) % 6) - 3) - 1;
    return [f(0), f(1), f(2)].map((x) => Math.max(0, Math.min(1, x)));
}

// enstantiate bacteria on the circle
for (let i = 0; i < bacteriaCount; i++) {
    const angle = Math.random() * 2 * Math.PI; // tand angle
    const x = Math.cos(angle) * 0.8; // center x (main circ)
    const y = Math.sin(angle) * 0.8; // center y (main)
    bacteria.push({ x, y, radius: 0.0 }); // init rad ~= 0
    bacteriaColors.push(randomHueToRGB(Math.random() * 360));
}

// bacteria growth
function updateBacteria(deltaTime) {
    const growthRate = 0.05; // rate (grw per second)
    bacteria.forEach((b) => {
        b.radius += growthRate * deltaTime; // we grow our rad
    });
}

function render(timestamp) {
    const deltaTime = timestamp - (lastFrameTime || timestamp);
    lastFrameTime = timestamp;

    updateBacteria(deltaTime / 1000); // bacteria growth

    // sned uniform to shader
    const uBacteria = gl.getUniformLocation(program, "u_Bacteria"); const uColors = gl.getUniformLocation(program, "u_Colors");
    const uBacteriaCount = gl.getUniformLocation(program, "u_BacteriaCount");

    const bacteriaData = bacteria.flatMap((b) => [b.x, b.y, b.radius]);
    const colorsData = bacteriaColors.flat();

    gl.uniform3fv(uBacteria, new Float32Array(bacteriaData));
    gl.uniform3fv(uColors, new Float32Array(colorsData));  gl.uniform1i(uBacteriaCount, bacteriaCount);

    // clr
    gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(render);
}

let lastFrameTime = null; requestAnimationFrame(render);

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
    uniform vec2 u_Center;       // board center
    uniform float u_Radius;      // board radius
    uniform vec3 u_Bacteria[10]; // enemy data: [x, y, radius]
    uniform vec3 u_Colors[10];   // enem colors (RGB)
    uniform int u_BacteriaCount; // number of bactria

    void main() {
        vec2 coord = (gl_FragCoord.xy / 300.0) - vec2(1.0, 1.0); // Normalize to (-1, 1)
        float dist = distance(coord, u_Center);

        if (dist <= u_Radius) {
            // draw board (white)
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);

            // check if within any bacteria circle
            for (int i = 0; i < 10; i++) {
                if (i >= u_BacteriaCount) break;

                vec2 bacteriaCenter = u_Bacteria[i].xy;
                float bacteriaRadius = u_Bacteria[i].z;
                float bacteriaDist = distance(coord, bacteriaCenter);

                if (bacteriaDist <= bacteriaRadius) {
                    gl_FragColor = vec4(u_Colors[i], 1.0); // Bacteria color
                }
            }
        } else {
            discard; // oob
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
    -1.0, -1.0, 1.0, -1.0,
    -1.0,  1.0, 1.0,  1.0 ]);

const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const aPosition = gl.getAttribLocation(program, "a_Position");
gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(aPosition);

// uniforms
const uCenter = gl.getUniformLocation(program, "u_Center"); const uRadius = gl.getUniformLocation(program, "u_Radius");
gl.uniform2f(uCenter, 0.0, 0.0); gl.uniform1f(uRadius, 0.8); //cent & rad

// make scene
gl.clearColor(0.0, 0.0, 0.0, 1.0); // black background
gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
