import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import tintVertexShader from './shaders/tint/vertex.glsl'
import tintFragmentShader from './shaders/tint/fragment.glsl'
import displacementVertexShader from './shaders/displacement/vertex.glsl'
import displacementFragmentShader from './shaders/displacement/fragment.glsl'
import newDisplacementVertexShader from './shaders/newDisplacement/vertex.glsl'
import newDisplacementFragmentShader from './shaders/newDisplacement/fragment.glsl'


import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass.js'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'  // ANTIALIAS

import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js'
import { gsap } from "gsap"

import GUI from 'lil-gui'












/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()



/**
 * Loaders
 */

const loadingBarElement = document.querySelector(".loading-bar")

const loadingManager = new THREE.LoadingManager(
    //loaded
    () =>
    {
        window.setTimeout(()=>{

            gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value : 0})
        loadingBarElement.classList.add("ended")
        loadingBarElement.style.transform = ""


        }, 600)

        

    },
    //progress
    (itemUrl, itemsLoaded, itemsTotal) =>
    {

        const progressRatio = itemsLoaded/itemsTotal
        loadingBarElement.style.transform = `scaleX(${progressRatio})`

    }
)
const gltfLoader = new GLTFLoader(loadingManager)
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager)
const textureLoader = new THREE.TextureLoader(loadingManager)




//OVERLAY

const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1,)
const overlayMaterial = new THREE.ShaderMaterial(
    {
        transparent:true,
        uniforms: {
            uAlpha: {value: 1}
        },
    vertexShader:`
        void main ()
        {
            gl_Position = vec4(position, 1.0);
        }
        
        `,
        fragmentShader: `
        uniform float uAlpha;
        
        void main()
        {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
        }
        `
        

    })

const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)

/**
 * Update all materials
 */
const updateAllMaterials = () =>
{
    scene.traverse((child) =>
    {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
        {
            child.material.envMapIntensity = 2.5
            child.material.needsUpdate = true
            child.castShadow = true
            child.receiveShadow = true
        }
    })
}

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.png',
    '/textures/environmentMaps/0/nx.png',
    '/textures/environmentMaps/0/py.png',
    '/textures/environmentMaps/0/ny.png',
    '/textures/environmentMaps/0/pz.png',
    '/textures/environmentMaps/0/nz.png'
])

scene.background = environmentMap
scene.environment = environmentMap

/**
 * Models
 */
let robot = null
let mixer = null

gltfLoader.load(
    '/models/r2-d2.glb',
    (gltf) =>
    {
        robot = gltf.scene
        robot.traverse((child) =>
        {

            mixer = new THREE.AnimationMixer(robot)
            const action = mixer.clipAction(gltf.animations[0])

            action.play()

            //console.log(action);



            scene.add(robot)
            robot.position.y = -3
            robot.rotation.y = Math.PI * 0.5
            robot.scale.set(5, 5, 5)
            
            
        })

        
        
    }

)

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 3, - 2.25)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


    //UPDATE EFFECT COMPOSER 

    effectComposer.setSize(sizes.width, sizes.height)                 //  NUEVO RESIZE PARA EL EFFECT COMPOSER
    effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))//  NUEVO RESIZE PARA EL EFFECT COMPOSER


})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(4, 1, - 4)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 1.5
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


// Audio setup
const audioLoader = new THREE.AudioLoader();
const listener = new THREE.AudioListener();
const sound = new THREE.Audio(listener);

// Botón o acción del usuario para iniciar el audio
document.body.addEventListener('click', () => {
    if (listener.context.state === 'suspended') {
        listener.context.resume();
    }

    // Sólo cargar y reproducir el sonido si aún no se ha reproducido
    if (!sound.source) {
        audioLoader.load('/models/audio.mp3', function(buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(false);
            sound.setVolume(0.5);
            sound.play();
        });
    }
});

camera.add(listener); // Asegúrate de que la cámara existe cuando agregues el listener








//POST PROCESSING - 

//RENDER TARGET

const renderTarget = new THREE.WebGLRenderTarget(
    800,
    600,
    {
        samples: renderer.getPixelRatio() === 1 ? 2 : 0
    }
)




//EFFECT COMPOSER - 

const effectComposer = new EffectComposer(renderer, renderTarget)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
effectComposer.setSize(sizes.width, sizes.height)


//RENDER PASS - 
const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

const dotScreenPass = new DotScreenPass()
dotScreenPass.enabled = false
effectComposer.addPass(dotScreenPass)


const glitchScreenPass = new GlitchPass()
glitchScreenPass.goWild = false
glitchScreenPass.enabled = false
effectComposer.addPass(glitchScreenPass)

const unrealBloomPass = new UnrealBloomPass()
unrealBloomPass.strength = 1.5
unrealBloomPass.radius = 2
unrealBloomPass.threshold = 0.6
unrealBloomPass.enabled = false
effectComposer.addPass(unrealBloomPass)

gui.add(unrealBloomPass, "enabled")
gui.add(unrealBloomPass, "strength").min(0).max(2).step(0.001).name("strength")
gui.add(unrealBloomPass, "radius").min(0).max(2).step(0.001).name("radius")
gui.add(unrealBloomPass, "threshold").min(0).max(1).step(0.001).name("threshold")



//TINT SHADER

const tintShader = {
    uniforms:{
        tDiffuse: {value: null},
        uTint: {value: null}
    },
    vertexShader: tintVertexShader,
    fragmentShader: tintFragmentShader,

}



const tintPass =  new ShaderPass(tintShader)
tintPass.material. uniforms.uTint.value = new THREE.Vector3(0.0, 0.0, 0.0)
effectComposer.addPass(tintPass)

// gui.add(tintPass.material. uniforms.uTint.value, "x").min(-0.5).max(0.5).step(0.001).name("R")
// gui.add(tintPass.material. uniforms.uTint.value, "y").min(-0.5).max(0.5).step(0.001).name("G")
// gui.add(tintPass.material. uniforms.uTint.value, "z").min(-0.5).max(0.5).step(0.001).name("B")





//DISPLACEMENT SHADER

// const displacementShader = {
//     uniforms:{
//         tDiffuse: {value: null},
//         uTime: {value: null}
  
//     },
//     vertexShader: displacementVertexShader,
//     fragmentShader: displacementFragmentShader,

// }

// const displacementPass =  new ShaderPass(displacementShader)
// displacementPass.material.uniforms.uTime.value = 0
// effectComposer.addPass(displacementPass)




//NEW DISPLACEMENT SHADER

const newDisplacementShader = {
    uniforms:{
        tDiffuse: {value: null},
        uNormalMap: {value: null}
        
  
    },
    vertexShader: newDisplacementVertexShader,
    fragmentShader: newDisplacementFragmentShader,

}

const newDisplacementPass =  new ShaderPass(newDisplacementShader)
newDisplacementPass.material.uniforms.uNormalMap.value = textureLoader.load("/textures/interfaceNormalMap.png")
effectComposer.addPass(newDisplacementPass)






const rbgShiftPass = new ShaderPass(RGBShiftShader)
rbgShiftPass.enabled = false
effectComposer.addPass(rbgShiftPass)



//gamma correction pass 

const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader)
effectComposer.addPass(gammaCorrectionPass)

//SMAA PASS

if(renderer.getPixelRatio()=== 1 && !renderer.capabilities.isWebGL2)
{
    const smaaPass = new SMAAPass()
    effectComposer.addPass(smaaPass)

}







/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    //UPDATE UTIME DISPLACEMENT 
    //displacementPass.material.uniforms.uTime.value = elapsedTime

    //update animation

    if(mixer !== null )
    {
        mixer.update(deltaTime)

    }

    // Update controls
    controls.update()

    // Render
    //renderer.render(scene, camera)
    effectComposer.render()  //NUEVO RENDER PARA EL EFFECT COMPOSER

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()