function Heixiu() {
  //材质属性
  this.materialAmbient = vec4(0.1, 0.1, 0.1, 1.0);
  this.materialDiffuse = vec4(0.2, 0.2, 0.2, 1.0);
  this.materialSpecular = vec4(0.01, 0.01, 0.01, 1.0);
  this.shininess = 1.0;
  this.useTexture = true;
  this.texture = null;
  this.FORWARD_STEP = 0.5;
  this.ROTATE_STEP = 5;
  this.RESIZE_STEP = 0.1;
  this.perVertexColor = true;
  this.rotateAngle = 0; //the angle around axis Y,start from positive x-axis.
  this.position = null; //the location of the center point of this animal.
  this.size = 0.2; //expand and shrink factor.
  this.vbo = null;
  this.cbo = null;
  this.nbo = null;
  this.tbo = null;
  this.vertexNum = 0;
  this.transformMatrix = null;
  this.onChange = null;
} //indicate some prototype parameters for Heixiu.


Heixiu.prototype.texture_empty = function (theta, fai, size) {
  return vec2(0, 0);
}

Heixiu.prototype.texture_coordinate = function (x, y, z, height, width) {
  if (z < 0) {
    return vec2(0, 0);
  }
  x = (x + width / 2.0) / width;
  y = (-y + height / 2.0) / height;
  return vec2(x, y);
}
Heixiu.prototype.setLocation = function (a, b, c) {
  this.position = vec3(a, b, c);
  this.updateTransformMatrix();
};

Heixiu.prototype.build = function () {

  var image = document.getElementById("heixiuImage");
  this.texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);

  var textures = [];
  var vertices = [];
  var normals = [];
  //init shape_data
  var shape_data = {
    origin: vec3(0, 0, 0),

    axis_length: vec3(this.size * 5, this.size * 4, this.size * 4), //5:4:4
    angle_range_vertical: vec2(0, 180),
    angle_range_horizontal: vec2(0, 360),

    ellipse_axis: vec2(0, 0, 0),
    top_point: vec3(0, 0, 0),
    angle_range: vec2(0, 360),
  };
  //set and get body vertices, textures and normals.
  var body_vertices = ellipsoid_generator(shape_data, texture_coordinate);
  vertices = vertices.concat(body_vertices.vertices);
  textures = textures.concat(body_vertices.textures);
  normals = normals.concat(body_vertices.normals);

  //right ear shape_data initialization.
  shape_data.ellipse_axis = vec2(this.size * 1.5, this.size * 1.5);
  shape_data.top_point = vec3(0, 2 * this.size + 0.5, 0);

  //set and get right ear vertices, textures and normals.
  var rightear_vertices = taper_generator(shape_data, texture_empty);
  this.constructMatrix(
    mult(translate(-this.size * 2.5, this.size * 2, 0), rotateZ(-20)),
    rightear_vertices.vertices
  );

  //left ear shape_data initialization.
  vertices = vertices.concat(rightear_vertices.vertices);
  textures = textures.concat(rightear_vertices.textures);
  normals = normals.concat(rightear_vertices.normals);

  //set and get left ear vertices.
  var leftear_vertices = taper_generator(shape_data, texture_empty);
  this.constructMatrix(
    mult(translate(this.size * 2.5, this.size * 2, 0), rotateZ(20)),
    leftear_vertices.vertices
  );


  vertices = vertices.concat(leftear_vertices.vertices);
  textures = textures.concat(leftear_vertices.textures);
  normals = normals.concat(leftear_vertices.normals);

  this.vertexNum = vertices.length;
  this.vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  this.nbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  this.tbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.tbo);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(textures), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

Heixiu.prototype.updateTransformMatrix = function () {
  //update transform matrix
  var RE = scalem(this.size, this.size, this.size);
  var T = translate(this.position[0], this.position[1], this.position[2]);
  var R = rotateY(this.rotateAngle);
  this.transformMatrix = mult(T, mult(R, RE));

  if (this.onChange) {
    this.onChange();
  }
};

Heixiu.prototype.constructMatrix = function (matrix, vertices) {
  for (var i = 0; i < vertices.length; i++) {
    var temp = mult(
      matrix,
      vec4(vertices[i][0], vertices[i][1], vertices[i][2], 1)
    );
    vertices[i] = vec3(temp[0], temp[1], temp[2]);
  }
};

Heixiu.prototype.walkForward = function () {
  this.position[0] +=
    this.FORWARD_STEP * -1 * Math.sin(radians(this.rotateAngle));
  this.position[2] += this.FORWARD_STEP * Math.cos(radians(this.rotateAngle));
  this.updateTransformMatrix();
  if (this.onChange) {
    this.onChange();
  }
};

Heixiu.prototype.walkBackward = function () {
  this.position[0] += this.FORWARD_STEP * Math.sin(radians(this.rotateAngle));
  this.position[2] +=
    this.FORWARD_STEP * -1 * Math.cos(radians(this.rotateAngle));
  this.updateTransformMatrix();
  if (this.onChange) {
    this.onChange();
  }
};

Heixiu.prototype.rotateLeft = function () {
  this.rotateAngle -= this.ROTATE_STEP;
  this.updateTransformMatrix();
  if (this.onChange) {
    this.onChange();
  }
};

Heixiu.prototype.rotateRight = function () {
  this.rotateAngle += this.ROTATE_STEP;
  this.updateTransformMatrix();
  if (this.onChange) {
    this.onChange();
  }
};

Heixiu.prototype.shrink = function () {
  this.size -= this.RESIZE_STEP;
  this.updateTransformMatrix();
  if (this.onChange) {
    this.onChange();
  }
};

Heixiu.prototype.expand = function () {
  this.size += this.RESIZE_STEP;
  this.updateTransformMatrix();
  if (this.onChange) {
    this.onChange();
  }
};