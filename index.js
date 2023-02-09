import {
  m4, programs, primitives,
  vertexArrays, setUniforms,
  createProgramInfo, setDefaults,
  resizeCanvasToDisplaySize,
  drawObjectList,
       } from './twgl-full.module.js';

import {Node, makeDrawList} from './scenegraph.js';

const vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec4 a_color;

// A matrix to transform the positions by
uniform mat4 u_matrix;

out vec4 v_color;

// all shaders have a main function
void main() {
  gl_Position = u_matrix * a_position;
  v_color = a_color;
}
`;

const fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;
in vec4 v_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  // Just set the output to a constant
  outColor = v_color;
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

    // the primitives module outputs attributes without a prefix
    // and it's nice to have one for shaders imo
    setDefaults({ attribPrefix: 'a_' });

    this.programInfo = createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);

    this.sceneGraph = makeSceneGraph(gl, this.programInfo);
    this.drawList = makeDrawList(this.sceneGraph);

    this.translation = [0, 0, 500];
    this.rotation = [0, 0, 0];
    this.scale = [1, 1, 1];
    this.fieldOfView = Math.PI / 3;

    resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // turn on depth testing
    gl.enable(gl.DEPTH_TEST);

    // tell webgl to cull faces
    gl.enable(gl.CULL_FACE);
    this.draw(0);
  }

  draw(timestamp) {
    resizeCanvasToDisplaySize(this.canvas);
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 1;
    const zFar = 2000;
    this.matrix = m4.perspective(this.fieldOfView, aspect, zNear, zFar);
    this.camera = m4.translation(this.translation);
    this.camera = m4.rotateX(this.camera, this.rotation[0]);
    this.camera = m4.rotateY(this.camera, this.rotation[1]);
    this.camera = m4.rotateZ(this.camera, this.rotation[2]);
    this.camera = m4.scale(this.camera, this.scale);
    this.camera = m4.inverse(this.camera);
    this.matrix = m4.multiply(this.matrix, this.camera);
    setUniforms(this.programInfo, {u_matrix: this.matrix});
    drawObjectList(gl, this.drawList);
    window.requestAnimationFrame(this.draw.bind(this));
  }
}

const renderer = new Three();

const xSlider = document.querySelector('#x-axis');
xSlider.addEventListener('input', (event) => {
  renderer.translation[0] = event.target.value * 1000;
});

const ySlider = document.querySelector('#y-axis');
ySlider.addEventListener('input', (event) => {
  renderer.translation[1] = event.target.value * 1000;
});

const zSlider = document.querySelector('#z-axis');
zSlider.addEventListener('input', (event) => {
  renderer.translation[2] = event.target.value * 1000;
});
const xRot = document.querySelector('#x-rot');
xRot.addEventListener('input', (event) => {
  renderer.rotation[0] = event.target.value * 2 * Math.PI;
});

const yRot = document.querySelector('#y-rot');
yRot.addEventListener('input', (event) => {
  renderer.rotation[1] = event.target.value * 2 * Math.PI;
});

const zRot = document.querySelector('#z-rot');
zRot.addEventListener('input', (event) => {
  renderer.rotation[2] = event.target.value * 2 * Math.PI;
});

function makeSceneGraph(gl, programInfo) {
  const FBufferInfo = primitives.create3DFBufferInfo(gl);
  const crescentBufferInfo = primitives.createCrescentBufferInfo(gl, 100, 100, 50, 20, 8);
  return new Node({name: "Root", children: [
    new Node({
      name: "F",
      transforms: {
        translation: [0, 0, 0],
        rotation: [0, 0, 2],
        scale: [1, 1, 1],
      },
      drawInfo: {
        vertexArray: vertexArrays.createVAOFromBufferInfo(
          gl,
          programInfo,
          FBufferInfo,
        ),
        bufferInfo: FBufferInfo,
        programInfo: programInfo,
      }
    }),
    new Node({
      name: "Crescent",
      transforms: {
        translation: [100, 100, 0],
        rotation: [10, 1, 0],
        scale: [1, 1, 1],
      },
      drawInfo: {
        vertexArray: vertexArrays.createVAOFromBufferInfo(
          gl,
          programInfo,
          crescentBufferInfo,
        ),
        bufferInfo: crescentBufferInfo,
        programInfo: programInfo,
      }
    }),
  ]});
}
