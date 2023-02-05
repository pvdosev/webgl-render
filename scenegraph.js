import {m4} from './twgl-full.module.js';

export class Node {
  constructor (data) {
    this.children = [];
    this.localMatrix = m4.identity();
    this.worldMatrix = m4.identity();
    // add custom properties
    if (data) {
      Object.assign(this, data);
    }
  }

  setParent(parent) {
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      if (index >= 0) {
        this.parent.children.splice(index, 1);
      }
    }
    if (parent) {
      parent.children.append(this);
    }
    this.parent = parent;
  }

  updateWorldMatrix(parentWorldMatrix) {
    if (parentWorldMatrix) {
      // a matrix was passed in so do the math and
      // store the result in `this.worldMatrix`.
      m4.multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
    } else {
      // no matrix was passed in so just copy.
      m4.copy(this.localMatrix, this.worldMatrix);
    }

    // now process all the children
    var worldMatrix = this.worldMatrix;
    this.children.forEach(function(child) {
      child.updateWorldMatrix(worldMatrix);
    });
  }
}
