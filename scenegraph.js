import {m4, setUniforms, setBuffersAndAttributes, drawBufferInfo} from './twgl-full.module.js';

export class Node {
  constructor (data) {
    this.children = [];
    this.worldMatrix = m4.identity();
    this.transforms = {
      translation: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    };
    // add custom properties
    if (data) {
      Object.assign(this, data);
    }
  }

  render(gl, viewMatrix) {
    const projectionMatrix = m4.multiply(viewMatrix, this.worldMatrix);
    for (const primitive of this.primitives) {
      gl.useProgram(primitive.programInfo.program);
      setUniforms(primitive.programInfo, {u_matrix: projectionMatrix}, this.uniforms);
      setBuffersAndAttributes(gl, primitive.programInfo, primitive.vertexArrayInfo);
      drawBufferInfo(gl, primitive.vertexArrayInfo);
    }
  }

  get transformMatrix() {
    // in case we need some specific transform,
    // give the object a localMatrix to replace the default
    if (this.localMatrix) {return this.localMatrix};
    let transMatrix = m4.translation(this.transforms.translation);
    m4.rotateX(transMatrix, this.transforms.rotation[0], transMatrix);
    m4.rotateY(transMatrix, this.transforms.rotation[1], transMatrix);
    m4.rotateZ(transMatrix, this.transforms.rotation[2], transMatrix);
    m4.scale(transMatrix, this.transforms.scale, transMatrix);
    return transMatrix;
  }

  setParent(parent) {
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      if (index >= 0) {
        this.parent.children.splice(index, 1);
      }
    }
    if (parent) {
      parent.children.push(this);
    }
    this.parent = parent;
  }

  updateWorldMatrix(parentWorldMatrix) {
    if (parentWorldMatrix) {
      // a matrix was passed in so do the math and
      // store the result in `this.worldMatrix`.
      m4.multiply(parentWorldMatrix, this.transformMatrix, this.worldMatrix);
    } else {
      // no matrix was passed in so just copy.
      m4.copy(this.transformMatrix, this.worldMatrix);
    }

    // now process all the children
    this.children.forEach((child) => {
      child.updateWorldMatrix(this.worldMatrix);
    });
  }
}

// walk down the tree, building an array of nodes that contain draw data
export function makeDrawList(node) {
  let drawList = [];
  if (node.drawable) {drawList.push(node)}
  if (node.children)
  {
    for (const child of node.children) {
      drawList.push(...makeDrawList(child));
    }
  }
  return drawList;
}
