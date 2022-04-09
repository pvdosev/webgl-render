// personal webgl library
// Licensed under the fafol license :)
// https://git.sr.ht/~boringcactus/fafol/tree/master/LICENSE.md

function resizeCanvasToDisplaySize(canvas) {
    const width  = canvas.clientWidth  | 0;
    const height = canvas.clientHeight | 0;
    if (canvas.width !== width ||  canvas.height !== height) {
            canvas.width  = width;
            canvas.height = height;
            return true;
    }
    return false;
}

function createShader(gl, shaderType, source) {
    let shader = gl.createShader(shaderType);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    // we could throw an error instead?
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    // I don't know much about error handling yet
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

export { resizeCanvasToDisplaySize, createShader, createProgram };
