import * as THREE from "three";
function applySurfaceMix(material, mossMap, mossTile) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uMossMap = { value: mossMap };
    shader.uniforms.uMossTile = { value: mossTile };
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
attribute float aMoss;
attribute float aWet;
varying float vMoss;
varying float vWet;`
    ).replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
vMoss = aMoss;
vWet = aWet;`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
uniform sampler2D uMossMap;
uniform float uMossTile;
varying float vMoss;
varying float vWet;`
    ).replace(
      "#include <color_fragment>",
      `#include <color_fragment>
{
  vec3 mossCol = texture2D(uMossMap, vMapUv * uMossTile).rgb;
  #ifdef USE_COLOR
    mossCol *= vColor.rgb;
  #endif
  diffuseColor.rgb = mix(diffuseColor.rgb, mossCol, clamp(vMoss, 0.0, 1.0));
  diffuseColor.rgb *= mix(1.0, 0.62, clamp(vWet, 0.0, 1.0));
}`
    ).replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, roughnessFactor * 0.28 + 0.045, clamp(vWet, 0.0, 1.0));`
    );
  };
  material.customProgramCacheKey = () => `surface-mix-${mossTile.toFixed(3)}`;
}
function applyLeafLighting(material, backMap, thicknessMap) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uMapBack = { value: backMap };
    shader.uniforms.uThick = { value: thicknessMap };
    shader.uniforms.uTransColor = { value: new THREE.Color("#c5d392") };
    shader.uniforms.uTransScale = { value: 0.72 };
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
uniform sampler2D uMapBack;
uniform sampler2D uThick;
uniform vec3 uTransColor;
uniform float uTransScale;`
    ).replace(
      "#include <map_fragment>",
      `#ifdef USE_MAP
  vec4 sampledDiffuseColor = gl_FrontFacing
    ? texture2D(map, vMapUv)
    : texture2D(uMapBack, vMapUv);
  diffuseColor *= sampledDiffuseColor;
#endif`
    ).replace(
      "#include <lights_fragment_end>",
      `#include <lights_fragment_end>
#if NUM_DIR_LIGHTS > 0
{
  float thick = texture2D(uThick, vMapUv).r;
  vec3 L = directionalLights[0].direction;
  vec3 Lc = directionalLights[0].color;
  float ndl = dot(normal, L);
  float backlight = pow(saturate(-ndl), 1.2);
  float wrap = saturate(ndl * 0.5 + 0.5);
  reflectedLight.directDiffuse += diffuseColor.rgb * Lc * wrap * 0.1;
  reflectedLight.directDiffuse += diffuseColor.rgb * uTransColor * Lc * backlight * thick * uTransScale;
}
#endif
reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(0.04, 0.05, 0.04);`
    );
  };
  material.customProgramCacheKey = () => "fig-leaf-translucent";
}
export {
  applyLeafLighting,
  applySurfaceMix
};
