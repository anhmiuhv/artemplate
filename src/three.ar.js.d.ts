import { WebGLRenderer, Camera } from 'three'

export namespace ARUtils {
	export function displayUnsupportedMessage(): any;
	export function getARDisplay(): Promise<ARDisplay>;
}

export class ARDisplay extends VRDisplay {
	hitTest(x: number, y:number) : any;
}

export class ARPerspectiveCamera extends Camera {
	constructor(display: ARDisplay, angle: number, aspectratio: number, depthnear: number, depthfar: number);
	aspect: number;
	updateProjectionMatrix(): any;
}

export class ARView {
	constructor(dispaly: ARDisplay, renderer: WebGLRenderer);
	render(): any;
}

export class ARDebug {
	constructor(display: ARDisplay);
	getElement(): HTMLElement;
}