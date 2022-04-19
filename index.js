import {
  resizeCanvasToDisplaySize,
  createShader,
  createProgram
} from './libgl.js';

// Template strings to hold the glsl. TODO make lil editor

function main() {
  const vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;
uniform vec2 u_resolution;

// all shaders have a main function
void main() {

  // since we're passing in pixel coordinates,
  // they need to be converted to clip space.
  //
  gl_Position = vec4(a_position / u_resolution * 2.0 - 1.0, 0, 1);

}
`;

  const fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;
uniform vec4 u_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  // Just set the output to a constant
  outColor = u_color;
}
`;

  const canvas = document.querySelector("#mainCanvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    console.log("Ye can't webgl (your browser doesn't support v2?)");
  } // try and set up the webgl 2 context. TODO more error handling

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);
  // we should have a glsl program on the gpu now!

  const colorLocation = gl.getUniformLocation(program, "u_color");
  const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const vao = gl.createVertexArray();

  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);

  const size = 2; // 2 components per iteration
  const type = gl.FLOAT; // the data is 32bit floats
  const normalize = false; // don't normalize the data
  const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  const attribOffset = 0; // start at the beginning of the buffer

  gl.vertexAttribPointer(
    positionAttributeLocation, size, type, normalize, stride, attribOffset
  )

  resizeCanvasToDisplaySize(gl.canvas)

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  // Bind the attribute/buffer set we want.
  gl.bindVertexArray(vao);
  for (let i = 0; i < randInt(100); ++i) {
    // Make random rectangle
    makeRect(gl, randInt(300), randInt(300), randInt(300), randInt(300));

    // Give it a random color
    gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }

}

function randInt(limit) {
  return Math.floor(Math.random() * limit);
}

function makeRect(gl, x1, y1, width, height) {
  const x2 = x1 + width;
  const y2 = y1 + height;
  // if we had more than 1 buffer we have to switch to the one with positions here
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2
  ]), gl.STATIC_DRAW);
}



main();
