﻿// this shader is from: https://github.com/gkjohnson/threejs-sandbox
/* eslint-disable camelcase */

import { Matrix3, Matrix4, ShaderChunk, ShaderMaterial, UniformsUtils, Vector2 } from "three"

// Modified ShaderChunk.skinning_pars_vertex to handle
// a second set of bone information from the previous frame
const prev_skinning_pars_vertex = /* glsl */ `
		#ifdef USE_SKINNING
		#ifdef BONE_TEXTURE
			uniform sampler2D prevBoneTexture;
			mat4 getPrevBoneMatrix( const in float i ) {
				float j = i * 4.0;
				float x = mod( j, float( boneTextureSize ) );
				float y = floor( j / float( boneTextureSize ) );
				float dx = 1.0 / float( boneTextureSize );
				float dy = 1.0 / float( boneTextureSize );
				y = dy * ( y + 0.5 );
				vec4 v1 = textureLod( prevBoneTexture, vec2( dx * ( x + 0.5 ), y ), 0. );
				vec4 v2 = textureLod( prevBoneTexture, vec2( dx * ( x + 1.5 ), y ), 0. );
				vec4 v3 = textureLod( prevBoneTexture, vec2( dx * ( x + 2.5 ), y ), 0. );
				vec4 v4 = textureLod( prevBoneTexture, vec2( dx * ( x + 3.5 ), y ), 0. );
				mat4 bone = mat4( v1, v2, v3, v4 );
				return bone;
			}
		#else
			uniform mat4 prevBoneMatrices[ MAX_BONES ];
			mat4 getPrevBoneMatrix( const in float i ) {
				mat4 bone = prevBoneMatrices[ int(i) ];
				return bone;
			}
		#endif
		#endif
`

export const velocity_vertex_pars = /* glsl */ `
#define MAX_BONES 64
                    
${ShaderChunk.skinning_pars_vertex}
${prev_skinning_pars_vertex}

uniform mat4 velocityMatrix;
uniform mat4 prevVelocityMatrix;
varying vec4 prevPosition;
varying vec4 newPosition;

varying vec2 vHighPrecisionZW;
`

// Returns the body of the vertex shader for the velocity buffer
export const velocity_vertex_main = /* glsl */ `
// Get the current vertex position
transformed = vec3( position );
${ShaderChunk.skinning_vertex}
newPosition = velocityMatrix * vec4( transformed, 1.0 );

// Get the previous vertex position
transformed = vec3( position );
${ShaderChunk.skinbase_vertex.replace(/mat4 /g, "").replace(/getBoneMatrix/g, "getPrevBoneMatrix")}
${ShaderChunk.skinning_vertex.replace(/vec4 /g, "")}
prevPosition = prevVelocityMatrix * vec4( transformed, 1.0 );

gl_Position = newPosition;

vHighPrecisionZW = gl_Position.zw;
`

export const velocity_fragment_pars = /* glsl */ `
varying vec4 prevPosition;
varying vec4 newPosition;

varying vec2 vHighPrecisionZW;
`

export const velocity_fragment_main = /* glsl */ `
vec2 pos0 = (prevPosition.xy / prevPosition.w) * 0.5 + 0.5;
vec2 pos1 = (newPosition.xy / newPosition.w) * 0.5 + 0.5;

vec2 vel = pos1 - pos0;

float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;

gl_FragColor = vec4(vel.x, vel.y, 0., 0.);
`

export const velocity_uniforms = {
	prevVelocityMatrix: { value: new Matrix4() },
	velocityMatrix: { value: new Matrix4() },
	prevBoneTexture: { value: null },
	boneTexture: { value: null },
	normalMap: { value: null },
	normalScale: { value: new Vector2(1, 1) },
	uvTransform: { value: new Matrix3() }
}

export class VelocityDepthNormalMaterial extends ShaderMaterial {
	constructor(camera) {
		super({
			uniforms: {
				...UniformsUtils.clone(velocity_uniforms),
				...{
					cameraMatrixWorld: { value: camera.matrixWorld }
				}
			},
			vertexShader: /* glsl */ `
					#include <common>
					#include <uv_pars_vertex>
					#include <displacementmap_pars_vertex>
					#include <normal_pars_vertex>
					#include <morphtarget_pars_vertex>
					#include <logdepthbuf_pars_vertex>
					#include <clipping_planes_pars_vertex>

					varying vec2 vUv;

					varying vec3 vViewPosition;
					
                    ${velocity_vertex_pars}
        
                    void main() {
						vec3 transformed;

						#include <uv_vertex>

						#include <skinbase_vertex>
						#include <beginnormal_vertex>
						#include <skinnormal_vertex>
						#include <defaultnormal_vertex>

						#include <morphnormal_vertex>
						#include <normal_vertex>
						#include <morphtarget_vertex>
						#include <displacementmap_vertex>
						#include <project_vertex>
						#include <logdepthbuf_vertex>
						#include <clipping_planes_vertex>

						${velocity_vertex_main}

						vViewPosition = - mvPosition.xyz;

						vUv = uv;

                    }`,
			fragmentShader: /* glsl */ `
					precision highp float;
					uniform mat4 cameraMatrixWorld;

					varying vec3 vViewPosition;

					${velocity_fragment_pars}
					#include <packing>

					#include <uv_pars_fragment>
					#include <normal_pars_fragment>
					#include <normalmap_pars_fragment>

					varying vec2 vUv;

					// source: https://knarkowicz.wordpress.com/2014/04/16/octahedron-normal-vector-encoding/
					vec2 OctWrap( vec2 v ) {
						vec2 w = 1.0 - abs( v.yx );
						if (v.x < 0.0) w.x = -w.x;
						if (v.y < 0.0) w.y = -w.y;
						return w;
					}

					vec2 encodeOctWrap(vec3 n) {
						n /= (abs(n.x) + abs(n.y) + abs(n.z));
						n.xy = n.z > 0.0 ? n.xy : OctWrap(n.xy);
						n.xy = n.xy * 0.5 + 0.5;
						return n.xy;
					}

					float packNormal(vec3 normal) {
						return uintBitsToFloat(packHalf2x16(encodeOctWrap(normal)));
					}

                    void main() {
						#define vNormalMapUv vUv

						#include <normal_fragment_begin>
                    	#include <normal_fragment_maps>

						${velocity_fragment_main}
						vec3 worldNormal = normalize((cameraMatrixWorld * vec4(normal, 0.)).xyz);
						gl_FragColor.b = packNormal(worldNormal);
						gl_FragColor.a = fragCoordZ;
                    }`
		})
	}
}
