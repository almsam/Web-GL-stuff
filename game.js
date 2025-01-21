// get WebGL context
const canvas = document.getElementById("gameCanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
    console.error("WebGL not supported!");
}

const bacteriaCount = 10; // number of enemies
const bacteria = [];
const bacteriaColors = [];

function randomHueToRGB(hue) {
    const chroma = 1; // saturated colour
    const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
    let r = 0, g = 0, b = 0;

    if (hue >= 0 && hue < 60) [r, g, b] = [chroma, x, 0];
    else if (hue >= 60 && hue < 120) [r, g, b] = [x, chroma, 0];
    else if (hue >= 120 && hue < 180) [r, g, b] = [0, chroma, x];
    else if (hue >= 180 && hue < 240) [r, g, b] = [0, x, chroma];
    else if (hue >= 240 && hue < 300) [r, g, b] = [x, 0, chroma];
    else if (hue >= 300 && hue < 360) [r, g, b] = [chroma, 0, x];

    return [r, g, b]; // retrun RGB vals
}

// egame loop
for (let i = 0; i < bacteriaCount; i++) {
    const angle = Math.random() * 2 * Math.PI; // tand angle
    const x = Math.cos(angle) * 0.8; // center x (main circ)
    const y = Math.sin(angle) * 0.8; // center y (main)
    bacteria.push({ x, y, radius: 0.0 }); // init rad ~= 0

    const randomHue = Math.random() * 360; // randd hue (0-360)
    bacteriaColors.push(randomHueToRGB(randomHue));}

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

    // check if within any bacteria circle
    for (int i = 0; i < 10; i++) {
        if (i >= u_BacteriaCount) break;

        vec2 bacteriaCenter = u_Bacteria[i].xy; float bacteriaRadius = u_Bacteria[i].z;
        float bacteriaDist = distance(coord, bacteriaCenter);

        if (bacteriaDist <= bacteriaRadius) {
            // Render bacteria color if the fragment is inside a bacteria circle
            gl_FragColor = vec4(u_Colors[i], 1.0);
            return;
        }
    }


    // OOB
    float dist = distance(coord, u_Center);
    if (dist <= u_Radius) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // main circ (white area)
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // oob (black backgroun)
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
