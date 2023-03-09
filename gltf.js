import {Node} from './scenegraph.js';
import {attributes, m4, createBufferInfoFromArrays, vertexArrays} from './twgl-full.module.js';
// I'm lazy so only implementing the glb format
export async function loadGLB(gl, url, programInfo) {
  const response = await fetch(url);
  // we're using Uint32 because the chunks are aligned to 4 bytes (32 bits)
  const file = new Uint32Array(await response.arrayBuffer());
  // For more detailed info see:
  // https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#glb-file-format-specification
  // 0x46546C67 is the magic constant of a glb file ("gLTF" in little endian ascii)
  // 0x4E4F534A is "json" in ascii, which is what the first chunk should contain
  if (!(file[0] === 0x46546C67 && file[4] === 0x4E4F534A)) {throw("Malformed GLB file!")}
  // this parser was written with v2 in mind
  // if I cared about standards compliance I would also be checking the json
  if (!(file[1] == 2)) {
    console.warn("GLB file " + url + " is version " + file[1] + " when it should be 2!");
  }
  const length = file[2];
  const jsonLength = file[3];
  // jsonLength is in bytes but we're using 32 bit wide arrays
  const bufferLength = file[jsonLength / 4 + 5];
  // the standard says jsonLength is the length of the chunk data,
  // but the length from the exporter counts from the start of the file?
  const rawJson = file.subarray(5, jsonLength / 4 + 5);
  const textDecoder = new TextDecoder(); //utf8 by default
  const metadata = JSON.parse(textDecoder.decode(rawJson));

  const data = new Uint8Array(file.buffer, jsonLength + 28, bufferLength);
  if (metadata.buffers.length > 1)
  {console.warn("Uh oh, multiple buffers. This file may not work")}

  // no support for sparse data yet. we ignore byteStride
  const bufferViews = [];
  for (const[i, bufferView] of metadata.bufferViews.entries()) {
    bufferViews.push(data.subarray(
      bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength
    ));
    if (bufferView.byteStride)
    {console.warn("Sparse data detected in buffer! This file may not work!")}
  }

  const typeMap = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
  }

  const accessors = [];
  for (const [i, accessor] of metadata.accessors.entries()) {
    const Type = typeMap[accessor.componentType];
    accessors.push(new Type(
      bufferViews[accessor.bufferView].buffer,
      bufferViews[accessor.bufferView].byteOffset,
      bufferViews[accessor.bufferView].byteLength / Type.BYTES_PER_ELEMENT,
    ));
  }

  const attribMap = {
    COLOR_0: "color",
    NORMAL: "normal",
    POSITION: "position",
    TEXCOORD_0: "texcoord",
  }

  // this one's a bit silly, I'm sure there's a better way
  const numMap = {
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
  }

  // TODO make this less ugly
  const meshes = [];
  for (const mesh of metadata.meshes) {
    const primitives = [];
    for (const primitive of mesh.primitives) {
      const attributes = {};
      for (const attribKey in primitive.attributes) {
        const attribName = attribMap[attribKey];
        const accessorIndex = primitive.attributes[attribKey];
        const accessor = metadata.accessors[accessorIndex];
        attributes[attribName] = {
          data: accessors[accessorIndex],
          numComponents: numMap[accessor.type],
          type: accessor.componentType,
        }
      }
      attributes.indices = {
        numComponents: 1,
        data: accessors[primitive.indices],
        type: 5123,
      }
      const meshInfo = {};
      meshInfo.bufferInfo = createBufferInfoFromArrays(gl, attributes);
      meshInfo.programInfo = programInfo;
      meshInfo.vertexArrayInfo =
        vertexArrays.createVertexArrayInfo(gl, programInfo, meshInfo.bufferInfo);
      primitives.push(meshInfo);
    }
    meshes.push(primitives);
  }

  function makeNodes(nodeNum) {
    const output = new Node();
    const nodeInfo =  metadata.nodes[nodeNum];
    for (const node in nodeInfo.children) {
      output.children.push(makeNodes(node));
    }
    if ("translation" in nodeInfo) {output.transforms.translation = nodeInfo.translation}
    if ("rotation" in nodeInfo) {output.transforms.rotation = nodeInfo.rotation}
    if ("scale" in nodeInfo) {output.transforms.scale = nodeInfo.scale}
    if ("name" in nodeInfo) {output.name = nodeInfo.name}
    if ("mesh" in nodeInfo) {
      output.primitives = meshes[nodeInfo.mesh];
      output.drawable = true;
    }
    return output;
  }

  const root = new Node();
  // use default scene, or scene 0 if undefined.
  // technically there could be more than 1 scene, but let's ignore that
  const sceneIndex = metadata.scene ?? 0;
  for (const sceneNode in metadata.scenes[sceneIndex].nodes) {
    root.children.push(makeNodes(sceneNode));
  }
  return root;
}
