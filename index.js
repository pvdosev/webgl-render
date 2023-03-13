import {
  m4, programs, vertexArrays,
  createProgramInfo, setDefaults,
  resizeCanvasToDisplaySize,
       } from './twgl-full.module.js';

import {Node, makeDrawList} from './scenegraph.js';

import {loadGLB} from './gltf.js';

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
  if (v_color == vec4(0.0, 0.0, 0.0, 1.0)) {
    outColor = vec4(1.0, 1.0, 0.0, 1.0);
  }
}
`;

function euclideanDist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

// TODO: Add some acceleration and smoothing
class Orbit {
  eventCache = new Map();
  cameraMatrix = m4.inverse(m4.translation([0, 0, 10]));
  transforms = {
    translation: [0, 0, 10],
    rotation: [0, 0],
  }
  pinchZoomDist = 0;

  constructor(canvas) {
    this.canvas = canvas;
    canvas.onpointerdown = this.handleStart.bind(this);
    canvas.onpointerup = this.handleStop.bind(this);
    canvas.onpointercancel = this.handleStop.bind(this);
    canvas.onpointerout = this.handleStop.bind(this);
    canvas.onpointermove = this.handleMove.bind(this);
    canvas.onwheel = this.handleScroll.bind(this);
  }
  handleStop(event) {
    this.eventCache.delete(event.pointerId);
  }
  handleStart(event) {
    this.eventCache.set(event.pointerId, event);
    if (this.eventCache.size === 2) {
      const event1 = this.eventCache.get(0);
      const event2 = this.eventCache.get(1);
      this.pinchZoomDist = euclideanDist(event1.pageX, event1.pageY, event2.pageX, event2.pageY);
    }
  }
  handleMove(event) {
    if (this.eventCache.size > 0) {
      const rotY = this.eventCache.get(event.pointerId).pageY - event.pageY;
      const rotX = this.eventCache.get(event.pointerId).pageX - event.pageX;
      this.transforms.rotation[0] = this.transforms.rotation[0] + (rotX * .01);
      this.transforms.rotation[1] = this.transforms.rotation[1] + (rotY * .01);
      this.calcMatrix();
      this.eventCache.set(event.pointerId, event);
    }
    if (this.eventCache.size === 2) {
      const event1 = this.eventCache.get(0);
      const event2 = this.eventCache.get(1);
      const currZoom = euclideanDist(event1.pageX, event1.pageY, event2.pageX, event2.pageY);
      this.transforms.translation[2] =
        this.transforms.translation[2] + (this.pinchZoomDist - currZoom) * .01;
      this.pinchZoomDist = currZoom;
    }
  }
  handleScroll(event) {
    this.transforms.translation[2] = this.transforms.translation[2] + event.deltaY * .005;
    this.calcMatrix();
  }
  calcMatrix() {
    m4.rotationY(this.transforms.rotation[0], this.cameraMatrix);
    m4.rotateX(this.cameraMatrix, this.transforms.rotation[1], this.cameraMatrix);
    m4.translate(this.cameraMatrix, this.transforms.translation, this.cameraMatrix);
    m4.inverse(this.cameraMatrix, this.cameraMatrix);
  }
}

class Three {
  constructor (nodeTree) {
    this.canvas = document.querySelector("#mainCanvas");
    this.gl = this.canvas.getContext("webgl2");
    const gl = this.gl; // less typing
    if (!gl) {
      console.log("Ye can't webgl (your browser doesn't support webgl2?)");
    } // try and set up the webgl 2 context. TODO more error handling

    setDefaults({ attribPrefix: 'a_' });
    this.sceneGraph = new Node();
    this.drawList = [];
    this.programInfo = createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);
    this.translation = [0, 0, 10];
    this.rotation = [0, 0, 0];
    this.scale = [1, 1, 1];
    this.fieldOfView = Math.PI / 3;
    this.camera = new Orbit(this.canvas);
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

  switchSceneGraph(sceneGraph) {
    this.sceneGraph = sceneGraph;
    this.drawList = makeDrawList(sceneGraph);
  }

  draw(timestamp) {
    resizeCanvasToDisplaySize(this.canvas);
    let aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    const zNear = 1;
    const zFar = 2000;
    this.viewProjection = m4.perspective(this.fieldOfView, aspect, zNear, zFar);
    this.viewProjection = m4.multiply(this.viewProjection, this.camera.cameraMatrix);
    this.sceneGraph.updateWorldMatrix();

    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.drawList.forEach(object => {
      object.render(gl, this.viewProjection);
    });
    window.requestAnimationFrame(this.draw.bind(this));
  }
}

const renderer = new Three();
const input = await loadGLB(renderer.gl, './bucket.glb', renderer.programInfo);
console.log(input);
renderer.switchSceneGraph(input);
