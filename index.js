import {
  resizeCanvasToDisplaySize,
  createShader,
  createProgram
} from './libgl.js';

const vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

// A matrix to transform the positions by
uniform mat3 u_matrix;

// all shaders have a main function
void main() {
  // Multiply the position by the matrix.
  vec2 position = (u_matrix * vec3(a_position, 1)).xy;

  gl_Position = vec4(position / u_resolution * 2.0 - 1.0, 0, 1);
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

class Three {
  constructor () {
    this.canvas = document.querySelector("#mainCanvas");
    this.gl = this.canvas.getContext("webgl2");
    const gl = this.gl; // less typing
    if (!gl) {
      console.log("Ye can't webgl (your browser doesn't support v2?)");
    } // try and set up the webgl 2 context. TODO more error handling

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);
    // we should have a glsl program on the gpu now!

    this.colorLocation = gl.getUniformLocation(program, "u_color");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    this.matrixLocation = gl.getUniformLocation(program, "u_matrix");
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
    );

    this.translation = [500, 500];
    this.rotationInRadians = 0;
    this.scale = [1, -1];
    let translationMatrix = m3.translation(this.translation[0], this.translation[1]);
    let rotationMatrix = m3.rotation(this.rotationInRadians);
    let scaleMatrix = m3.scaling(this.scale[0], this.scale[1]);

    // Multiply the matrices.
    let matrix = m3.multiply(translationMatrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);

    resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);
    gl.uniformMatrix3fv(this.matrixLocation, false, matrix);
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    setGeometry(gl);

    this.draw(0);
  }

  draw(timestamp) {
    // Give it a random color
    //this.gl.uniform4f(this.colorLocation, Math.random(), Math.random(), Math.random(), 1);
    this.gl.uniform4f(this.colorLocation, 1, 1, 0, 1);
    let translationMatrix = m3.translation(this.translation[0], this.translation[1]);
    this.rotationInRadians += 0.1;
    let rotationMatrix = m3.rotation(this.rotationInRadians);
    let scaleMatrix = m3.scaling(this.scale[0], this.scale[1]);

    // Multiply the matrices.
    let matrix = m3.multiply(translationMatrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);
    this.gl.uniformMatrix3fv(this.matrixLocation, false, matrix);

    // Draw the rectangle.
    const primitiveType = this.gl.TRIANGLES;
    const offset = 0;
    const count = 18;
    this.gl.drawArrays(primitiveType, offset, count);
    window.requestAnimationFrame(this.draw.bind(this));
  }
}

const renderer = new Three();

const button = document.querySelector('#draw');
button.addEventListener('click', function (event) {
  renderer.draw();
});
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // left column
          0, 0,
          30, 0,
          0, 150,
          0, 150,
          30, 0,
          30, 150,

          // top rung
          30, 0,
          100, 0,
          30, 30,
          30, 30,
          100, 0,
          100, 30,

          // middle rung
          30, 60,
          67, 60,
          30, 90,
          30, 90,
          67, 60,
          67, 90,
      ]),
      gl.STATIC_DRAW);
}

// Fill the current ARRAY_BUFFER buffer
// with the values that define a letter 'F'.
// function setGeometry(gl) {
//   gl.bufferData(
//       gl.ARRAY_BUFFER,
//       new Float32Array([
//           // left column front
//           0,   0,  0,
//           0, 150,  0,
//           30,   0,  0,
//           0, 150,  0,
//           30, 150,  0,
//           30,   0,  0,

//           // top rung front
//           30,   0,  0,
//           30,  30,  0,
//           100,   0,  0,
//           30,  30,  0,
//           100,  30,  0,
//           100,   0,  0,

//           // middle rung front
//           30,  60,  0,
//           30,  90,  0,
//           67,  60,  0,
//           30,  90,  0,
//           67,  90,  0,
//           67,  60,  0,

//           // left column back
//             0,   0,  30,
//            30,   0,  30,
//             0, 150,  30,
//             0, 150,  30,
//            30,   0,  30,
//            30, 150,  30,

//           // top rung back
//            30,   0,  30,
//           100,   0,  30,
//            30,  30,  30,
//            30,  30,  30,
//           100,   0,  30,
//           100,  30,  30,

//           // middle rung back
//            30,  60,  30,
//            67,  60,  30,
//            30,  90,  30,
//            30,  90,  30,
//            67,  60,  30,
//            67,  90,  30,

//           // top
//             0,   0,   0,
//           100,   0,   0,
//           100,   0,  30,
//             0,   0,   0,
//           100,   0,  30,
//             0,   0,  30,

//           // top rung right
//           100,   0,   0,
//           100,  30,   0,
//           100,  30,  30,
//           100,   0,   0,
//           100,  30,  30,
//           100,   0,  30,

//           // under top rung
//           30,   30,   0,
//           30,   30,  30,
//           100,  30,  30,
//           30,   30,   0,
//           100,  30,  30,
//           100,  30,   0,

//           // between top rung and middle
//           30,   30,   0,
//           30,   60,  30,
//           30,   30,  30,
//           30,   30,   0,
//           30,   60,   0,
//           30,   60,  30,

//           // top of middle rung
//           30,   60,   0,
//           67,   60,  30,
//           30,   60,  30,
//           30,   60,   0,
//           67,   60,   0,
//           67,   60,  30,

//           // right of middle rung
//           67,   60,   0,
//           67,   90,  30,
//           67,   60,  30,
//           67,   60,   0,
//           67,   90,   0,
//           67,   90,  30,

//           // bottom of middle rung.
//           30,   90,   0,
//           30,   90,  30,
//           67,   90,  30,
//           30,   90,   0,
//           67,   90,  30,
//           67,   90,   0,

//           // right of bottom
//           30,   90,   0,
//           30,  150,  30,
//           30,   90,  30,
//           30,   90,   0,
//           30,  150,   0,
//           30,  150,  30,

//           // bottom
//           0,   150,   0,
//           0,   150,  30,
//           30,  150,  30,
//           0,   150,   0,
//           30,  150,  30,
//           30,  150,   0,

//           // left side
//           0,   0,   0,
//           0,   0,  30,
//           0, 150,  30,
//           0,   0,   0,
//           0, 150,  30,
//           0, 150,   0,
//       ]),
//       gl.STATIC_DRAW);
// }

// Fill the current ARRAY_BUFFER buffer with colors for the 'F'.
function setColors(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array([
          // left column front
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

          // top rung front
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

          // middle rung front
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

          // left column back
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,

          // top rung back
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,

          // middle rung back
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,

          // top
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,

          // top rung right
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,

          // under top rung
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,

          // between top rung and middle
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,

          // top of middle rung
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,

          // right of middle rung
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,

          // bottom of middle rung.
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,

          // right of bottom
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,

          // bottom
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,

          // left side
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
      ]),
      gl.STATIC_DRAW);
}
