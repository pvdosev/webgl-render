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
  // the chunks are aligned to 4 bytes.
  // the standard says jsonLength is the length of the chunk data,
  // but the blender exporter counts from the start of the file?
  const rawJson = file.slice(5, jsonLength / 4 + 5);
  const textDecoder = new TextDecoder(); //utf8 by default
  const metadata = JSON.parse(textDecoder.decode(rawJson));
  const buffers = file.slice(jsonLength / 4 + 5, length);
  console.log(metadata);
  console.log(buffers);
}
