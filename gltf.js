import {Node} from './scenegraph.js';
// I'm lazy so only implementing the glb format
export async function loadGLB(url) {
  const response = await fetch(url);
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
  const bufferLength = file[jsonLength / 4];
  // the chunks are aligned to 4 bytes.
  // the standard says jsonLength is the length of the chunk data,
  // but the actual files count from the start of the file?
  const rawJson = file.slice(5, jsonLength / 4 + 5);
  const textDecoder = new TextDecoder(); //utf8 by default
  const metadata = JSON.parse(textDecoder.decode(rawJson));
  const buffers = file.slice(jsonLength / 4 + 5, length / 4);
  console.log(metadata);
  console.log(buffers);
  console.log("total: " + length + ", json: " + jsonLength + ", buffer: " + bufferLength);
  // loop through nodegraph
  // build our own nodegraph
  // add render data to it
  function makeNodes(nodeNum) {
    let output = new Node();
    const nodeInfo =  metadata.nodes[nodeNum];
    for (const node in nodeInfo.children) {
      output.children.push(makeNodes(node));
    }
    if (nodeInfo.translation) {output.transforms.translation = nodeInfo.translation}
    if (nodeInfo.rotation) {output.transforms.rotation = nodeInfo.rotation} // FIXME quaternion math
    if (nodeInfo.scale) {output.transforms.scale = nodeInfo.scale}
    if (nodeInfo.name) {output.name = nodeInfo.name}
    const meshInfo = metadata.meshes[nodeInfo.mesh];
    if (meshInfo) {
      console.log(meshInfo.primitives[0]);
    }
  }

  let root = new Node();
  // use default scene, or scene 0 if undefined.
  // technically there could be more than 1 scene, but let's ignore that
  const sceneIndex = metadata.scene ?? 0;
  for (const sceneNode in metadata.scenes[sceneIndex].nodes) {
    root.children.push(makeNodes(sceneNode));
  }
  return root;
}
