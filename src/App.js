import "./styles.css";

import React, { useEffect } from "react";
import * as THREE from "three";

let vertex = `
uniform sampler2D uTexture;
uniform vec2 uOffset;
varying vec2 vUv;

float M_PI = 3.141529;

vec3 deformationCurve(vec3 position, vec2 uv, vec2 offset){
    position.x = position.x + (sin(uv.y * M_PI) * offset.x);
    position.y = position.y + (sin(uv.x * M_PI) * offset.y);
    return position;
}

void main(){
    vUv = uv;
    vec3 newPosition = deformationCurve(position, uv, uOffset);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

let fragment = `
uniform sampler2D uTexture;
uniform float uAlpha;
uniform vec2 uOffset;
varying vec2 vUv;

vec3 rgbShift(sampler2D textureimage, vec2 uv, vec2 offset ){
    float r = texture2D(textureimage, uv + offset).r;
    vec2 gb = texture2D(textureimage, uv).gb;
    return vec3(r, gb);
}

void main(){
    // vec3 color = texture2D(uTexture, vUv).rgb;
    vec3 color = rgbShift(uTexture, vUv, uOffset);
    gl_FragColor = vec4(color, uAlpha);
}
`;

export default function App() {
  function lerp(start, end, t) {
    return start * (1 - t) + end * t;
  }

  function viewport() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    let aspectRatio = width / height;

    return {
      width,
      height,
      aspectRatio
    };
  }

  useEffect(() => {
    let targetX = 0,
      targetY = 0;
    let linkHovered;
    let texture = new THREE.TextureLoader().load(
      "https://picsum.photos/200/300"
    );
    let textureOne = new THREE.TextureLoader().load(
      "https://picsum.photos/seed/picsum/200/300"
    );

    let container = document.querySelector("#app2"),
      content = document.querySelectorAll(".content");

    let scene = new THREE.Scene();

    let perspective = 1000,
      sizes = new THREE.Vector2(0, 0),
      offset = new THREE.Vector2(0, 0),
      uniforms = {
        uTexture: { value: null },
        uAlpha: { value: 0.0 },
        uOffset: { value: new THREE.Vector2(0, 0) }
      };
    content.forEach((link, idx) => {
      link.addEventListener("mouseenter", () => {
        linkHovered = true;
        switch (idx) {
          case 0:
            uniforms.uTexture.value = texture;
            break;
          case 1:
            uniforms.uTexture.value = textureOne;
            break;
        }
      });
      link.addEventListener("mouseleave", () => {
        linkHovered = false;
        uniforms.uAlpha.value = lerp(uniforms.uAlpha.value, 0.0, 0.1);
      });
    });

    let fov =
      (180 * (2 * Math.atan(viewport().height / 2 / perspective))) / Math.PI;
    let camera = new THREE.PerspectiveCamera(
      fov,
      viewport().aspectRatio,
      0.1,
      1000
    );
    camera.position.set(0, 0, perspective);

    let renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(viewport().width, viewport().height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    window.addEventListener("mousemove", (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    let geometry = new THREE.PlaneGeometry(1, 1, 20, 20);
    let material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true
    });
    let mesh = new THREE.Mesh(geometry, material);
    sizes.set(250, 350, 1);
    mesh.scale.set(sizes.x, sizes.y, 1);
    mesh.position.set(offset.x, offset.y, 0);
    scene.add(mesh);

    function render() {
      offset.x = lerp(offset.x, targetX, 0.1);
      offset.y = lerp(offset.y, targetY, 0.1);
      uniforms.uOffset.value.set(
        (targetX - offset.x) * 0.0005,
        -(targetY - offset.y) * 0.0005
      );
      mesh.position.set(
        offset.x - window.innerWidth / 2,
        -offset.y + window.innerHeight / 2,
        0
      );

      linkHovered
        ? (uniforms.uAlpha.value = lerp(uniforms.uAlpha.value, 1, 0.1))
        : (uniforms.uAlpha.value = lerp(uniforms.uAlpha.value, 0, 0.1));

      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }
    render();
  }, []);

  return (
    <>
      <div id="app2" className="absolute h-screen w-screen top-0 left-0">
        <div id="content-1" className="content">
          <p>Hover me!</p>
        </div>
        <div id="content-2" className="content">
          <p>Hover me!</p>
        </div>
      </div>
    </>
  );
}
