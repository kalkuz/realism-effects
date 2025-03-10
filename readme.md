# three.js Realism Effects

ℹ Note: A new version of SSGI (version 2) and realism-effects in general is currently in the works. You can checkout the most recent progress on the `v2` branch. It features many performance and quality improvements over the current released version.
<br>
<br>
realism-effects is collection of the following effects for three.js:

- SSGI
  <br></br>
  [<img src="https://raw.githubusercontent.com/0beqz/realism-effects/main/screenshots/ssgi.webp">](https://realism-effects-git-v2-obeqz.vercel.app/)
  <br></br>
  <br></br>
  [<img src="https://raw.githubusercontent.com/0beqz/realism-effects/main/screenshots/ssgi2.webp">](https://realism-effects-git-v2-obeqz.vercel.app/)
  <br></br>
- Motion Blur
  <br></br>
  [<img src="https://raw.githubusercontent.com/0beqz/realism-effects/main/screenshots/motion_blur.webp">](https://realism-effects-git-v2-obeqz.vercel.app/)
  <br></br>
- TRAA
  <br>
  TRAA (left)&nbsp;&nbsp;&nbsp; No Anti-Aliasing (right)
  <br></br>
  [<img src="https://raw.githubusercontent.com/0beqz/realism-effects/main/screenshots/traa_comp.webp">](https://realism-effects-git-v2-obeqz.vercel.app/?traa_test=true)
  <br></br>
  AA comparison scenes: [Model Comparision](https://realism-effects-git-v2-obeqz.vercel.app//?traa_test=true&traa_test_model=true), [General Comparison](https://realism-effects-git-v2-obeqz.vercel.app//?traa_test=true)
  <br></br>
- Ambient Occlusion
  <br>
  SSAO (left) &nbsp;&nbsp;&nbsp; HBAO (right)
  <br></br>
  [<img src="https://raw.githubusercontent.com/0beqz/realism-effects/main/screenshots/ssao_hbao.webp">](https://realism-effects-git-v2-obeqz.vercel.app//?ao)
  Credits go to [N8programs](https://github.com/N8python) for the SSAO effect as well as the denoiser used for both AO effects (namely the `PoissonDenoisePass`)
  <br></br>
- SSR (Screen-Space Reflections)

<br>

> **ℹ️**: You can explore the demos by clicking on the images

<br>

## Usage

This effect uses postprocessing.js. If you don't have it installed, install it like so:

```shell
npm i postprocessing
```

Then install this effect by running:

```shell
npm i realism-effects
```

Then add it to your code like so:

```javascript
import * as POSTPROCESSING from "postprocessing"
import { SSGIEffect, TRAAEffect, MotionBlurEffect, VelocityDepthNormalPass } from "realism-effects"

const composer = new POSTPROCESSING.EffectComposer(renderer)

const velocityDepthNormalPass = new VelocityDepthNormalPass(scene, camera)
composer.addPass(velocityDepthNormalPass)

// SSGI
const ssgiEffect = new SSGIEffect(scene, camera, velocityDepthNormalPass, options?)

// TRAA
const traaEffect = new TRAAEffect(scene, camera, velocityDepthNormalPass)

// Motion Blur
const motionBlurEffect = new MotionBlurEffect(velocityDepthNormalPass)

// HBAO
const hbaoEffect = new HBAOEffect(composer, camera, scene)

const effectPass = new POSTPROCESSING.EffectPass(camera, ssgiEffect, hbaoEffect, traaEffect, motionBlur)

composer.addPass(effectPass)
```

> **NOTE**: `OrthographicCamera` isn't supported yet. Only `PerspectiveCamera` is supported at the moment. It'll be supported in the future.

## SSGI

### NOTE:

SSGI is being reworked in the branch [poisson-recursive](https://github.com/0beqz/realism-effects/tree/poisson-recursive) which provides far better performance, quality and memory usage over the current version of the main branch.
You can check out the up-to-date demo [here](https://realism-effects-git-poisson-recursive-obeqz.vercel.app/).
<br>
Keep in mind that it is a WIP version and thus issues like device-specific rendering issues will be adressed later on.

To-Dos:

- [ ] support most properties of MeshPhysicalMaterial (especially transmission, clearcoat, attenuation, sheen)
- [ ] proper alpha support
- [ ] approximate glossiness through blurring in the denoiser for less smearing
- [ ] absolutely optimized memory usage and buffer usage (encode diffuse and specular colors in SSGI & Temporal Reprojection pass in a single texture rather than 2)
- [ ] perfect env map reflection handling and detection of disocclusions through comparing average sample ray lengths
- [ ] suport for materials with custom shaders
- [ ] instead of using MRTMaterial to render out the necessary G-data for SSGI, use a patched MeshPhysicalMaterial for more consistency
- [ ] accumulate ray length
- [ ] fog support
- [ ] use faster approximation (inspired by AO effects) to calculate diffuse lighting?
- [ ] better method to detect and account for reprojection of pixels from steeper regions to flatter regions
- [ ] less specular smearing
- [ ] support `OrthographicCamera`

### Options

<details>
<summary>Default values of the optional "options" parameter</summary>

```javascript
const options = {
	distance: 10,
	thickness: 10,
	denoiseIterations: 1,
	denoiseKernel: 2,
	denoiseDiffuse: 10,
	denoiseSpecular: 10,
	depthPhi: 2,
	normalPhi: 50,
	roughnessPhi: 1,
	specularPhi: 1,
	envBlur: 0.5,
	importanceSampling: true,
	steps: 20,
	refineSteps: 5,
	resolutionScale: 1,
	missedRays: false
}
```

</details>

<br>

### Notes

If you use SSGI, then you don't have to use the RenderPass anymore as SSGI does the rendering then. You can save performance by leaving it out. Keep in mind that then you need to put TRAA and Motion Blur in a separate pass like so:

```javascript
const effectPass = new POSTPROCESSING.EffectPass(camera, ssgiEffect)
const effectPass2 = new POSTPROCESSING.EffectPass(camera, traaEffect, motionBlur)

composer.addPass(effectPass)
composer.addPass(effectPass2)
```

<br>

## Finding the right options through using a GUI

### ❗ Highly recommended: Use a GUI to tweak the options

Since the right options for an SSGI effect (or for other effects provided by `realism-effects`) depend a lot on the scene, it can happen that you don't seem to have an effect at all in your scene when you use the SSGI effect for the first time in it without any configuration. This can have multiple causes such as `distance` being way too low for your scene for example. So to find out which SSGI options are right for your scene, you should use a GUI to find the right values easily. The [example](https://github.com/0beqz/realism-effects/tree/main/example) already comes with a simple one-file GUI [`SSGIDebugGUI.js`](https://github.com/0beqz/traa/blob/main/example/SSGIDebugGUI.js) that you can use in your project like so:

- First install the npm package of the module used for the GUI:

```shell
npm i tweakpane
```

- then just copy the `SSGIDebugGUI.js` to your project and initialize it like so in your scene:

```javascript
import { SSGIDebugGUI } from "./SSGIDebugGUI"

const gui = new SSGIDebugGUI(ssgiEffect, options)
```

That's it, you should now have the GUI you can see in the example scene. The `options` parameter is optional for the SSGIDebugGUI and will default to the default options if no `options` parameter is given.

Besides for SSGI, there are also debug GUIs for more effects.
You can copy the following debug GUIs from the repository:

- HBAODebugGUI
- SSAODebugGUI
- SSGIDebugGUI

## Run Locally

If you'd like to test this project and run it locally, run these commands:

```shell
git clone https://github.com/0beqz/realism-effects
cd realism-effects/example
npm i --force
npm run dev
```

## Sponsoring

If the project is useful for you and you'd like to sponsor my work:

[GitHub Sponsors](https://github.com/sponsors/0beqz)

If you'd like, you could also buy me a coffee:

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/0beqz)

## Todos

- [ ] Use bent normals and/or calculate them at run-time? https://80.lv/articles/ssrtgi-toughest-challenge-in-real-time-3d/
- [ ] Proper transparency support
- [ ] Support OrthographicCameras
- [ ] Fog support (SSGI)
- [ ] Background support (SSGI without render pass)
- [ ] Fix TRAA dilation issue
- [ ] Test Log Transform with TRAA

## Credits

- SSR code: [Screen Space Reflections on Epsilon Engine](https://imanolfotia.com/blog/1)

- Edge fade for SSR: [kode80](http://kode80.com/blog/)

- Velocity Shader: [three.js sandbox](https://github.com/gkjohnson/threejs-sandbox)

- SSAO effect and PoissonDenoisePass: [N8programs](https://github.com/N8python) - GitHub Repo: [ssao](https://github.com/N8python/ssao)

- Lens distortion shader: [Radial lens undistortion filtering](https://marcodiiga.github.io/radial-lens-undistortion-filtering)

### Demo Scene

- Mercedes-Benz AMG-GT 2015: [Márcio Meireles](https://sketchfab.com/marciomeireles)
- 2019 Chevrolet Corvette C8 Stingray: [Hari](https://sketchfab.com/Hari31)
- Clay Bust Study: [lomepawol](https://sketchfab.com/lomepawol)
- Cyberpunk Bike: [Roman Red](https://sketchfab.com/OFFcours1)
- Cyber Samurai: [KhoaMinh](https://sketchfab.com/duongminhkhoa231)
- Darth Vader: [Brad Groatman](https://sketchfab.com/groatman)
- Flashbang Grenade: [Nikolay Kudrin](https://sketchfab.com/knik211)
- SPY-HYPERSPORT Motorbike: [Amvall](https://sketchfab.com/Amvall.Vall)
- Laocoon and His Sons Statue: [Rigsters](https://sketchfab.com/rigsters)
- Squid Game PinkSoldier: [Jaeysart](https://sketchfab.com/jaeysart)
- Berserk Guts Black Swordsman: [gimora](https://sketchfab.com/gimora)
- Time Machine (from TRAA demo scene): [vertexmonster](https://sketchfab.com/vertexmonster)
- Golden Knight: [FrancisLam](https://sketchfab.com/francislam)

## Possible Future Work

#### Screen Space Horizon GI

- Paper: https://arxiv.org/pdf/2301.11376.pdf
- Shadertoy Demo: https://www.shadertoy.com/view/dsGBzW
- Reddit Demos with author information: https://www.reddit.com/r/GraphicsProgramming/comments/17k4hpr/screen_space_horizon_gi/

#### Screen Space Contact Shadows

- Article discussing implementation: https://panoskarabelas.com/posts/screen_space_shadows/
- Presentation video from SCC: https://youtu.be/btWy-BAERoY?t=1933
- Example code and presentation from SCC: https://www.bendstudio.com/blog/inside-bend-screen-space-shadows/

## Resources

## Raytracing

- [EXPLORING RAYTRACED FUTURE IN METRO EXODUS](https://developer.download.nvidia.com/video/gputechconf/gtc/2019/presentation/s9985-exploring-ray-traced-future-in-metro-exodus.pdf)

- [Adventures in Hybrid Rendering](https://diharaw.github.io/post/adventures_in_hybrid_rendering/)

### Tracing in screen-space

- [Rendering view dependent reflections using the graphics card](https://kola.opus.hbz-nrw.de/opus45-kola/frontdoor/deliver/index/docId/908/file/BA_GuidoSchmidt.pdf)

- [Screen Space Reflections in Unity 5](http://www.kode80.com/blog/2015/03/11/realism-effects-in-unity-5/)

- [Screen Space Glossy Reflections](http://roar11.com/2015/07/screen-space-glossy-reflections/)

- [Screen Space Reflection (SSR)](https://lettier.github.io/3d-game-shaders-for-beginners/screen-space-reflection.html)

- [Approximating ray traced reflections using screenspace data](https://publications.lib.chalmers.se/records/fulltext/193772/193772.pdf)

- [Screen Space Reflection Techniques](https://ourspace.uregina.ca/bitstream/handle/10294/9245/Beug_Anthony_MSC_CS_Spring2020.pdf)

- [Shiny Pixels and Beyond: Real-Time Raytracing at SEED](https://media.contentapi.ea.com/content/dam/ea/seed/presentations/dd18-seed-raytracing-in-hybrid-real-time-rendering.pdf)

- [DD2018: Tomasz Stachowiak - Stochastic all the things: raytracing in hybrid real-time rendering (YouTube)](https://www.youtube.com/watch?v=MyTOGHqyquU)

- [Real-Time Reflections in Mafia III and Beyond](https://ubm-twvideo01.s3.amazonaws.com/o1/vault/gdc2018/presentations/Sobek_Martin_Real-time_Reflections_in_MafiaIII.pdf)

### Temporal Reprojection

- [Temporal Reprojection Anti-Aliasing in INSIDE](http://s3.amazonaws.com/arena-attachments/655504/c5c71c5507f0f8bf344252958254fb7d.pdf?1468341463)

- [Reprojecting Reflections](http://bitsquid.blogspot.com/2017/06/reprojecting-reflections_22.html)

- [Temporal AA (Unreal Engine 4)](https://de45xmedrsdbp.cloudfront.net/Resources/files/TemporalAA_small-59732822.pdf)

- [Temporally Reliable Motion Vectors for Real-time Ray Tracing](https://sites.cs.ucsb.edu/~lingqi/publications/paper_trmv.pdf)

- [Temporal AA and the quest for the Holy Trail](https://www.elopezr.com/temporal-aa-and-the-quest-for-the-holy-trail/)

- [Visibility TAA and Upsampling with Subsample History](http://filmicworlds.com/blog/visibility-taa-and-upsampling-with-subsample-history/)

- [Temporal Anti Aliasing – Step by Step](https://ziyadbarakat.wordpress.com/2020/07/28/temporal-anti-aliasing-step-by-step/)

- [Filmic SMAA: Sharp Morphological and Temporal Antialiasing](https://research.activision.com/publications/archives/filmic-smaasharp-morphological-and-temporal-antialiasing)

- [Reprojecting Reflections](http://bitsquid.blogspot.com/2017/06/reprojecting-reflections_22.html)

### HBAO

- [Horizon-Based Indirect Lighting (HBIL)](https://drive.google.com/file/d/1fmceYuM5J2s8puNHZ9o4OF3YjqzIvmRR/view)
- [Pyramid HBAO — a Scalable Horizon-based Ambient Occlusion Method](https://ceur-ws.org/Vol-3027/paper5.pdf)

## Lens Distortion

- [Realistic Lens Distortion Rendering](http://wscg.zcu.cz/WSCG2018/Poster/P83-full.PDF)
