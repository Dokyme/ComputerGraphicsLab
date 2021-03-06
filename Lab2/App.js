var TIMER_ID = -1;
var RENDER_RATE = 100;
var key_move = 0.1;

function App(ch, lh, dh) {
  this.load = () => {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
      alert("WebGL isn't available");
    }

    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.clearDepth(100.0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    viewportHeight = canvas.height;
    viewportWidth = canvas.width;
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
    aVertexColor = gl.getAttribLocation(program, "aVertexColor");

    camera = new Camera();
    camera.setLocation(0, 2, 10);
    camera.onChange = this.draw;
    interactor = new CameraInteractor(camera, canvas);

    uMVMatrix = gl.getUniformLocation(program, "uMVMatrix");
    uTMatrix = gl.getUniformLocation(program, "uTMatrix");
    uPMatrix = gl.getUniformLocation(program, "uPMatrix");
    uPerVertexColor = gl.getUniformLocation(program, "uPerVertexColor");
    uColor = gl.getUniformLocation(program, "uColor");

    Floor.build(40, 20);
    Scene.addObject(Floor);
    Scene.addObject(Heixiu);
    Scene.addObject(Xiaohei);

    document.getElementById("RotateLeft").onclick = () => {
      Xiaohei.rotateLeft();
    };
    document.getElementById("RotateRight").onclick = () => {
      Xiaohei.rotateRight();
    };
    document.getElementById("Forward").onclick = () => {
      Xiaohei.walkForward();
    };
    document.getElementById("Backward").onclick = () => {
      Xiaohei.walkBackward();
    };
    document.getElementById("Shrink").onclick = () => {
      Xiaohei.shrink();
    };
    document.getElementById("Expand").onclick = () => {
      Xiaohei.expand();
    };
    document.getElementById("RotateLeftd").onclick = () => {
      Heixiu.rotateLeft();
    };
    document.getElementById("RotateRightd").onclick = () => {
      Heixiu.rotateRight();
    };
    document.getElementById("Forwardd").onclick = () => {
      Heixiu.walkForward();
    };
    document.getElementById("Backwardd").onclick = () => {
      Heixiu.walkBackward();
    };
    document.getElementById("Shrinkd").onclick = () => {
      Heixiu.shrink();
    };
    document.getElementById("Expandd").onclick = () => {
      Heixiu.expand();
    };
    document.getElementById("in").onclick = () => {
      camera.dollyin();
    };
    document.getElementById("out").onclick = () => {
      camera.dollyout();
    };
    document.onkeydown = function (event) {
        var e = event || window.event || arguments.callee.caller.arguments[0];

        var length = Math.sqrt(camera.position[0] * camera.position[0] + camera.position[1] * camera.position[1] + camera.position[2] * camera.position[2]);

        if(e && e.keyCode == 37){
            camera.changeAzimuth(1);
        }
        else if(e && e.keyCode == 38){
            camera.changeElevation(1);
        }
        else if(e && e.keyCode == 39){
            camera.changeAzimuth(-1);
        }
        else if(e && e.keyCode == 40){
            camera.changeElevation(-1);
        }
        else if(e && e.keyCode ==  87){
            camera.setLocation(vec3(camera.position[0] - key_move * camera.position[0] / length,
                                    camera.position[1] - key_move * camera.position[1] / length,
                                    camera.position[2] - key_move * camera.position[2] / length));
        }
        else if(e && e.keyCode == 83) {
            camera.setLocation(vec3(camera.position[0] + key_move * camera.position[0] / length,
                                    camera.position[1] + key_move * camera.position[1] / length,
                                    camera.position[2] + key_move * camera.position[2] / length));
        }
    };
  };

  this.initTransform = () => {
    modelViewMatrix = camera.getViewTransform();
    perspectiveMatrix = perspective(
      50,
      viewportWidth / viewportHeight,
      1,
      1000
    );
  };

  this.updateMatrixUniforms = () => {
    perspectiveMatrix = perspective(
      50,
      viewportWidth / viewportHeight,
      1,
      1000.0
    );
    gl.uniformMatrix4fv(uMVMatrix, false, flatten(camera.getViewTransform()));
    gl.uniformMatrix4fv(uPMatrix, false, flatten(perspectiveMatrix));
  };

  this.draw = () => {
    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // gl.clearColor(0, 0, 0, 1);

    this.updateMatrixUniforms();

    for (var i = 0; i < Scene.objects.length; i++) {
      var object = Scene.objects[i];

      gl.uniform1i(uPerVertexColor, object.perVertexColor);

      if (object.directDraw) {
        object.draw();
        continue;
      }

      gl.uniform4fv(uColor, object.color);

      gl.disableVertexAttribArray(aVertexColor);

      gl.bindBuffer(gl.ARRAY_BUFFER, object.vbo);
      gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aVertexPosition);

      if (object.tMatrix) {
        gl.uniformMatrix4fv(uTMatrix, false, flatten(object.tMatrix));
      } else {
        gl.uniformMatrix4fv(uTMatrix, false, flatten(mat4()));
      }

      if (object.perVertexColor) {
        gl.bindBuffer(gl.ARRAY_BUFFER, object.cbo);
        gl.vertexAttribPointer(aVertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVertexColor);
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);

      if (object.wireframe) {
        gl.drawElements(gl.LINES, object.indices.length, gl.UNSIGNED_SHORT, 0);
      } else {
        gl.drawElements(
          gl.TRIANGLES,
          object.indices.length,
          gl.UNSIGNED_SHORT,
          0
        );
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
  };

  this.run = () => {
    this.load();
    this.initTransform();
    this.draw();
  };
}

