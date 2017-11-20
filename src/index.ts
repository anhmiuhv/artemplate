import { WebGLRenderer, Scene, Color, Group, Vector3, PointsMaterial, Geometry, Points } from 'three'
import { VRControls } from './vendor/VRControls'
import { ARDisplay, ARDebug, ARUtils, ARPerspectiveCamera, ARView } from 'three.ar.js'
import { PlaneHelper } from './helper/planehelper'
import { GraphInfo } from './helper/datahelper'
import { AnimationHelper } from './helper/animatehelper'

var vrDisplay: ARDisplay;
var vrControls: VRControls;
var arView: ARView;

var canvas: HTMLCanvasElement;
var camera: ARPerspectiveCamera;
var scene: Scene;
var renderer: WebGLRenderer;

var planeback: Group, planebottom: Group, planetop: Group, planeright: Group, planeleft: Group, planefront: Group;
var topbottom: Group[], therest: Group[], allplane: Group[];
var g: Group;

declare var data: any[];
 // = [ new Vector3(2,2,2),
 //                        new Vector3(-2,-9,-2),
 //                        new Vector3(1,0,1),
 //                        new Vector3(2,0,1),
 //                        new Vector3(0,0,0),
 //                        new Vector3(1,1,1)
 //                      ];

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

  // Turn on the debugging panel
  var arDebug = new ARDebug(display);
  document.body.appendChild(arDebug.getElement());

  // Setup the three.js rendering environment
  renderer = new WebGLRenderer({ alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  canvas = renderer.domElement;
  document.body.appendChild(canvas);
  scene = new Scene();

  // Creating the ARView, which is the object that handles
  // the rendering of the camera stream behind the three.js
  // scene
  arView = new ARView(display, renderer);

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

  let realdata = data.map((d) => {
    return new Vector3(d.x,d.y,d.z);
  })

  // VRControls is a utility from three.js that applies the device's
  // orientation/position to the perspective camera, keeping our
  // real world and virtual world in sync.
  vrControls = new VRControls(camera);
  
  // Bind our event handlers
  window.addEventListener('resize', onWindowResize, false);
  canvas.addEventListener('touchstart', onClick, false);

  const graphinfo = new GraphInfo(realdata);
  console.log(graphinfo);
  const graph = PlaneHelper.addplane(graphinfo.lowx,
                                      graphinfo.highx,
                                      graphinfo.lowy,
                                      graphinfo.highy,
                                      graphinfo.lowz,
                                      graphinfo.highz );
  graph.injectScene(scene);
  planeback = graph.planeback;
  planefront = graph.planefront;
  planeleft = graph.planeleft;
  planeright = graph.planeright;
  planetop = graph.planetop;
  planebottom = graph.planebottom;
  topbottom = [planetop, planebottom];
  therest = [planeleft, planeright, planefront, planeback];
  g = graph.graph;
  allplane = topbottom.concat( therest );


  graph.graph.translateZ(-1);
  graph.graph.translateY(-0.5);
  graph.graph.rotateY(Math.PI / 4);

  PlaneHelper.addxzaxis(topbottom);
  PlaneHelper.addyaxis(therest);

  let geometry = new Geometry();
  geometry.vertices.push(...graph.getVerticesForDisplay(graphinfo.vertices));
  let mat = new PointsMaterial({ size:0.05, color: 0x7FDBFF });
  let particles = new Points( geometry , mat );
  graph.graph.add(particles);


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
  var debug = false;
  if (i % 300 == 0) {
    debug = true
  }
  //hide plane according to the camera
  AnimationHelper.hidePlane(allplane, camera);
  AnimationHelper.hidexz(topbottom, camera, debug);
  AnimationHelper.hidey(therest, camera);

  
  // Render our three.js virtual scene
  renderer.clearDepth();
  renderer.render(scene, camera);

  // Kick off the requestAnimationFrame to call this function
  // when a new VRDisplay frame is rendered
  vrDisplay.requestAnimationFrame(update);

  i++;

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

/**
 * When clicking on the screen, fire a ray from where the user clicked
 * on the screen and if a hit is found, place a cube there.
 */
function onClick (e: TouchEvent) {
  // If we don't have a touches object, abort
  // TODO: is this necessary?
  if (!e.touches[0]) {
    return;
  }

  // Inspect the event object and generate normalize screen coordinates
  // (between 0 and 1) for the screen position.
  var x = e.touches[0].pageX / window.innerWidth;
  var y = e.touches[0].pageY / window.innerHeight;

  // Send a ray from the point of click to the real world surface
  // and attempt to find a hit. `hitTest` returns an array of potential
  // hits.
  var hits = vrDisplay.hitTest(x, y);

  // If a hit is found, just use the first one
  if (hits && hits.length) {
    var hit = hits[0];
    // Use the `placeObjectAtHit` utility to position
    // the cube where the hit occurred
    // THREE.ARUtils.placeObjectAtHit(sphere,  // The object to place
    //                                hit,   // The VRHit object to move the cube to
    //                                1,     // Easing value from 0 to 1; we want to move
    //                                       // the cube directly to the hit position
    //                                true); // Whether or not we also apply orientation

  }
}