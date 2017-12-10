import {
     WebGLRenderer, Scene, Color, Vector3, PerspectiveCamera
} from 'three'
import { VRControls } from './vendor/VRControls'
import { ARDisplay, ARDebug, ARUtils, ARPerspectiveCamera, ARView } from 'three.ar.js'
import { PlaneHelper, Graph } from './helper/planehelper'
import { GraphInfo } from './helper/datahelper'
import { AnimationHelper } from './helper/animatehelper'
import makeTextSprite from './helper/texthelper';
import { RenderHelper } from './helper/renderhelper'
import { EventHelper } from './helper/eventhelper'


var vrDisplay: ARDisplay;
var vrControls: VRControls;
var arView: ARView;

var canvas: HTMLCanvasElement;
var camera: ARPerspectiveCamera;
var scene: Scene;
var renderer: WebGLRenderer;
var text: HTMLCollectionOf<Element>;
var graph: Graph;

var started = true;


// declare var data: {x: number, y: number, z: number}[];
 var data = [ new Vector3(2,2,2), new Vector3(-2,-9,-2), new Vector3(1,0,1), new Vector3(2,0,1), new Vector3(0,0,0), new Vector3(1,1,1) ];

// declare var renderSphere: boolean;
var renderSphere = true;

var colors = [
new Color( 0xffffff ),
new Color( 0xffff00 ),
new Color( 0xff00ff ),
new Color( 0xff0000 ),
new Color( 0x00ffff ),
new Color( 0x00ff00 ),
new Color( 0x0000ff ),
new Color( 0x000000 )
];
/**
 *
 * Init ar display
 *
 */
 ARUtils.getARDisplay().then(init);

 function init(display: ARDisplay) {
     if (display === undefined) {
         ARUtils.displayUnsupportedMessage();
         return;
     }

     vrDisplay = display;

  // Setup the three.js rendering environment
  renderer = new WebGLRenderer({ alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  canvas = renderer.domElement;
  document.body.appendChild(canvas);
  scene = new Scene()

  // Creating the ARView, which is the object that handles
  // the rendering of the camera stream behind the three.js
  // scene
  arView = new ARView(display, renderer);
  text = document.getElementsByClassName("calibrate");
  // The ARPerspectiveCamera is very similar to THREE.PerspectiveCamera,
  // except when using an AR-capable browser, the camera uses
  // the projection matrix provided from the device, so that the
  // perspective camera's depth planes and field of view matches
  // the physical camera on the device.
  camera = new ARPerspectiveCamera(
      display,
      60,
      window.innerWidth / window.innerHeight,
      display.depthNear,
      display.depthFar
      );


  // VRControls is a utility from three.js that applies the device's
  // orientation/position to the perspective camera, keeping our
  // real world and virtual world in sync.
  vrControls = new VRControls(camera);
  
  // Bind our event handlers
  window.addEventListener('resize', onWindowResize, false);
  const eventhandler = new EventHelper.ZoomableThreeEvent(camera, graph);
  canvas.addEventListener('touchstart', eventhandler.genrateOnTouch() , false);
  canvas.addEventListener('touchmove', eventhandler.generateOnMove() , false);
  canvas.addEventListener('touchend', eventhandler.generateOnUp() , false);

  const graphinfo = new GraphInfo(data.map((v)=> {
      return new Vector3(v.z, v.y, v.z);
  }));
  console.log(graphinfo);
  graph = PlaneHelper.addplane( graphinfo );
  graph.injectScene(scene);


  graph.graph.translateZ(-1);
  graph.graph.translateY(-0.5);
  graph.graph.rotateY(Math.PI / 4);

  PlaneHelper.addxzaxis(graph.topbottom(), graph.scaleFactor);
  PlaneHelper.addyaxis(graph.therest(), graph.scaleFactor);

  if (renderSphere) {
      RenderHelper.renderSphere(scene, graphinfo, graph);
  } else {
      RenderHelper.renderPoints(scene, graphinfo, graph);
  }

  // Kick off the render loop!
  update();
}

var i = 0;
/**
 * The render loop, called once per frame. Handles updating
 * our scene and rendering.
 */
 function update() {
  // Clears color from the frame before rendering the camera (arView) or scene.
  renderer.clearColor();

  // Render the device's camera stream on screen first of all.
  // It allows to get the right pose synchronized with the right frame.
  arView.render();

  // Update our camera projection matrix in the event that
  // the near or far planes have updated
  camera.updateProjectionMatrix();

  // Update our perspective camera's positioning
  vrControls.update();

  hideTextbox();

  var debug = false;
  if (i % 300 == 0) {
      debug = true

  }
  //hide plane according to the camera
  AnimationHelper.hidePlane(graph.allplane(), camera);
  AnimationHelper.hideAxis(graph, camera);

  
  // Render our three.js virtual scene
  renderer.clearDepth();
  renderer.render(scene, camera);

  // Kick off the requestAnimationFrame to call this function
  // when a new VRDisplay frame is rendered
  vrDisplay.requestAnimationFrame(update);

  i++;

}

function hideTextbox() {
    if (started) {
        let vrframedata = new VRFrameData();
        vrDisplay.getFrameData(vrframedata);
        console.log(vrframedata.pose);
        const pose = vrframedata && vrframedata.pose && vrframedata.pose.position;
    // Ensure we have a valid pose; while the pose SHOULD be null when not
    // provided by the VRDisplay, on WebARonARCore, the xyz values of position
    // are all 0 -- mark this as an invalid pose
    const isValidPose = pose &&
    typeof pose[0] === 'number' &&
    typeof pose[1] === 'number' &&
    typeof pose[2] === 'number' &&
    !(pose[0] === 0 && pose[1] === 0 && pose[2] === 0);
    if (isValidPose) {
        started = false;
        (<HTMLElement>text.item(0)).style.visibility = 'hidden'; 
    }

}
}

/**
 * On window resize, update the perspective camera's aspect ratio,
 * and call `updateProjectionMatrix` so that we can get the latest
 * projection matrix provided from the device
 */
 function onWindowResize () {
     camera.aspect = window.innerWidth / window.innerHeight;
     camera.updateProjectionMatrix();
     renderer.setSize(window.innerWidth, window.innerHeight);
 }
