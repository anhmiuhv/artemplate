import {
  Material, Raycaster, Object3D, Vector2, MeshLambertMaterial, Mesh, SphereGeometry, AmbientLight
  , DirectionalLight, WebGLRenderer, Scene, Color, Group, Vector3, PointsMaterial
  , Geometry, Points, PerspectiveCamera
} from 'three'
import { VRControls } from './vendor/VRControls'
import { ARDisplay, ARDebug, ARUtils, ARPerspectiveCamera, ARView } from 'three.ar.js'
import { PlaneHelper, Graph } from './helper/planehelper'
import { GraphInfo } from './helper/datahelper'
import { AnimationHelper } from './helper/animatehelper'
import makeTextSprite from './helper/texthelper';


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

var planeback: Group, planebottom: Group, planetop: Group, planeright: Group, planeleft: Group, planefront: Group;
var topbottom: Group[], therest: Group[], allplane: Group[];
var g: Group;

declare var data: any[];
//  var data = [ new Vector3(2,2,2), new Vector3(-2,-9,-2), new Vector3(1,0,1), new Vector3(2,0,1), new Vector3(0,0,0), new Vector3(1,1,1) ];

declare var renderSphere: boolean;
// var renderSphere = true;

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
  // var arDebug = new ARDebug(display);
  // document.body.appendChild(arDebug.getElement());

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

  let realdata = data.map((d) => {
    return new Vector3(d.z,d.y,d.x);
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
  graph = PlaneHelper.addplane(graphinfo.lowx,
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

  PlaneHelper.addxzaxis(topbottom, graph.scaleFactor);
  PlaneHelper.addyaxis(therest, graph.scaleFactor);
  if (renderSphere) {
    var directionalLight = new DirectionalLight(0xffffff, 0.5);
    scene.add(directionalLight);
    var light = new AmbientLight(0xD3B4B4, 0.8 ); // soft white AmbientLight
    scene.add(light);
    var geometry = new SphereGeometry(0.1, 20, 20, 0, Math.PI * 2, 0, Math.PI * 2);
    var material = new MeshLambertMaterial({ color: 0xd3d3d3 });

    let pos = graph.getVerticesForDisplay(graphinfo.vertices);
    var count = 0;
    for (let i of pos) {
      var mesh = new Mesh(geometry, material);
      mesh.name = "sphere " + count;
      mesh.position.set(i.x, i.y, i.z);
      mesh.userData = Object.assign(mesh, mesh.userData, { oriData: graphinfo.vertices[count] });
      graph.graph.add(mesh);
      count++;
    }
  } else {
    let geometry = new Geometry();
    geometry.vertices.push(...graph.getVerticesForDisplay(graphinfo.vertices));
    let mat = new PointsMaterial({ size:0.05, color: 0x7FDBFF });
    let particles = new Points( geometry , mat );
    graph.graph.add(particles);
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

var mouse = new  Vector2();
var INTERSECTED: Mesh;
/**
 * When clicking on the screen, fire a ray from where the user clicked
 * on the screen and if a hit is found, place a cube there.
 */
function onClick (e: TouchEvent) {
  mouse.x = (e.touches[0].pageX / window.innerWidth) * 2 - 1;
  mouse.y = - (e.touches[0].pageY / window.innerHeight) * 2 + 1;
  

  // find intersections
  let raycaster = new Raycaster();
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(graph.graph.children);
  console.log(intersects);
  hideText();

  if (intersects.length > 0
    && INTERSECTED != intersects[0].object && 'oriData' in intersects[0].object.userData) {
    INTERSECTED = intersects[0].object as Mesh;
    const data = INTERSECTED.userData.oriData;
    if (INTERSECTED.children.length > 0) {
      INTERSECTED.children[0].visible = true;
      return;
    }
    const sprite = makeTextSprite(`x:${data.x}, y:${data.y}, z:${data.z}`, { fontsize: 12, scaleFactor: graph.scaleFactor, depthTest: false });
    sprite.position.add(new Vector3(0, 0.2, 0));
    INTERSECTED.add(sprite);

  } else {
    INTERSECTED = null;
  }
  function hideText() {
    if (INTERSECTED)
      INTERSECTED.children.length > 0 && (INTERSECTED.children[0].visible = false);
  }
}