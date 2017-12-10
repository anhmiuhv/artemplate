import { Mesh, Vector2, Raycaster, Camera, Vector3 } from 'three'
import makeTextSprite from './texthelper'
import { Graph } from "./planehelper"

export interface ThreeEvent extends Event {
  clientX: number;
  clientY: number;
  deltaY: number;
  button: THREE.MOUSE;
  touches: Array<Touch>;
  keyCode: number;
  pointerId: number;
}


export namespace EventHelper {
    export class GeneralThreeEvent {
        INTERSECTED: Mesh;
        camera: Camera;
        graph: Graph;

        constructor(camera: Camera, graph: Graph) {
            this.camera = camera;
            this.graph = graph;
        }

        genrateOnTouch(this: GeneralThreeEvent) {
            return (e: ThreeEvent) => {
                let mouse = new Vector2();
                
                if (!e.touches) {
                    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
                    mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
                } else {
                    mouse.x = (e.touches[0].pageX / window.innerWidth) * 2 - 1;
                    mouse.y = - (e.touches[0].pageY / window.innerHeight) * 2 + 1;
                }

                let hideText = () => {
                    if (this.INTERSECTED)
                        this.INTERSECTED.children.length > 0 && (this.INTERSECTED.children[0].visible = false);
                }
                
                // find intersections
                let raycaster = new Raycaster();
                raycaster.setFromCamera(mouse, this.camera);
                let intersects = raycaster.intersectObjects(this.graph.graph.children);
                console.log(intersects);
                hideText();
                
                if (intersects.length > 0
                    && this.INTERSECTED != intersects[0].object && 'oriData' in intersects[0].object.userData) {
                        this.INTERSECTED = intersects[0].object as Mesh;
                        const data = this.INTERSECTED.userData.oriData;
                        if (this.INTERSECTED.children.length > 0) {
                            this.INTERSECTED.children[0].visible = true;
                            return;
                        }
                        const sprite = makeTextSprite(`x:${data.x}, y:${data.y}, z:${data.z}`, { fontsize: 12, scaleFactor: this.graph.scaleFactor, depthTest: false });
                        sprite.position.add(new Vector3(0, 0.2, 0));
                        this.INTERSECTED.add(sprite);
                        
                    } else {
                        this.INTERSECTED = null;
                    }
                   
                }
            }
        }

        export class ZoomableThreeEvent {
            evCache: ThreeEvent[] = [];
            prevDiff: number;
            camera: Camera;
            graph: Graph;
            constructor(camera: Camera, graph: Graph) {
                this.camera = camera;
                this.graph = graph;
            }
            
          
            genrateOnTouch(this: ZoomableThreeEvent) {
                let generalCallback = new GeneralThreeEvent(this.camera, this.graph).genrateOnTouch();
                
                return (e: ThreeEvent) => {
                    switch (e.touches.length) {
                        case 1:
                            generalCallback(e);
                            break;
                        case 2:
                            this.evCache.push(e);
                        default:
                            // code...
                            break;
                    }
                }
            }

            generateOnMove(this: ZoomableThreeEvent) {
                return (e: ThreeEvent) => {
                     for (var i = 0; i < this.evCache.length; i++) {
                       if (e.pointerId == this.evCache[i].pointerId) {
                          this.evCache[i] = e;
                       break;
                       }
                     }

                     if (this.evCache.length == 2) {
                       // Calculate the distance between the two pointers
                       var curDiff = Math.abs(this.evCache[0].clientX - this.evCache[1].clientX);

                       if (this.prevDiff > 0) {
                         if (curDiff > this.prevDiff) {
                           // The distance between the two pointers has increased
                           console.log("Pinch moving OUT -> Zoom in", e);
                         }
                         if (curDiff < this.prevDiff) {
                           // The distance between the two pointers has decreased
                           console.log("Pinch moving IN -> Zoom out",e);
                         }
                       }

                       // Cache the distance for the next move event 
                       this.prevDiff = curDiff;
                     }
                }
            }

            generateOnUp(this: ZoomableThreeEvent) {
                return (e: ThreeEvent) => {
                      console.log(e.type, e);
                      // Remove this pointer from the cache and reset the target's
                      // background and border
                      this.remove_event(e);
                   
                     
                      // If the number of pointers down is less than two then reset diff tracker
                      if (this.evCache.length < 2) this.prevDiff = -1;
                }
            }

            remove_event(ev: ThreeEvent) {
             // Remove this event from the target's cache
             for (var i = 0; i < this.evCache.length; i++) {
               if (this.evCache[i].pointerId == ev.pointerId) {
                 this.evCache.splice(i, 1);
                 break;
               }
             }
}
    }
}