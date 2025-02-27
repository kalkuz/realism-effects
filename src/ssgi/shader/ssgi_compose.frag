﻿uniform sampler2D inputTexture;
uniform sampler2D sceneTexture;
uniform highp sampler2D depthTexture;
uniform bool isDebug;

uniform float cameraNear;
uniform float cameraFar;

#include <fog_pars_fragment>

// source: https://github.com/mrdoob/three.js/blob/79ea10830dfc97b6c0a7e29d217c7ff04c081095/examples/jsm/shaders/BokehShader.js#L66
float getViewZ(const in float depth) {
#if PERSPECTIVE_CAMERA == 1
  return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
#else
  return orthographicDepthToViewZ(depth, cameraNear, cameraFar);
#endif
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (isDebug) {
    outputColor = textureLod(inputTexture, uv, 0.);
    return;
  }

  float depth = textureLod(depthTexture, uv, 0.).r;
  vec4 sceneColor = textureLod(sceneTexture, uv, 0.);
  vec4 ssgiColor = textureLod(inputTexture, uv, 0.);

  if (depth == 1.0 || sceneColor.a < 0.99) {
    outputColor = sceneColor;
  } else {
    vec3 finalColor = ssgiColor.rgb;

#ifdef USE_FOG
    float viewZ = getViewZ(depth) * 0.4; // todo: find why 0.4 is needed to somewhat match three.js's result
    vFogDepth = -viewZ;

#include <fog_fragment>

    finalColor = mix(finalColor, fogColor, fogFactor);
#endif

    outputColor = vec4(finalColor, 1.0);
  }
}