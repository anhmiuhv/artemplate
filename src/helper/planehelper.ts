import { Scene, Group, Vector3, MeshBasicMaterial, Geometry, Points, LineSegments, Material, PlaneGeometry, Mesh, LineBasicMaterial, DoubleSide } from 'three';
import  { ScaleContinuousNumeric , scaleLinear } from 'd3-scale';
import makeTextSprite from './texthelper'

/**
 *
 * this class contains the graph the informations for a graph
 *
 */

class Graph {
	graph: Group
	deltax: number
	deltay: number
	deltaz: number
	scalex: ScaleContinuousNumeric<number, number>
	scaley: ScaleContinuousNumeric<number, number>
	scalez: ScaleContinuousNumeric<number, number>
	planetop: Group
	planebottom: Group
	planeright: Group
	planeleft: Group
	planefront: Group
	planeback: Group

	constructor(graph: Group, delta: number[], scale: ScaleContinuousNumeric<number, number>[], allplane: Group[]) {
		this.graph = graph;
		this.deltax = delta[0];
		this.deltay = delta[1];
		this.deltaz = delta[2];
		this.scalex = scale[0];
		this.scaley = scale[1]
		this.scalez = scale[2];
		this.planetop = allplane[0]
		this.planebottom = allplane[1]
		this.planeleft = allplane[2]
		this.planeright = allplane[3]
		this.planefront = allplane[4]
		this.planeback = allplane[5]
	}

	injectScene(scene: Scene) {
		scene.add(this.graph)
	}

	getVerticesForDisplay(vertices: Vector3[]): Vector3[] {
		return vertices.map((v) => {
			return new Vector3(this.scalez(v.z), this.scaley(v.y), this.scalex(v.x) );
		});
		
	}
}

export namespace PlaneHelper {
	/**
	 *
	 *  This function generate the axis plane, all variables are integers, low < high or function fail 
	 *
	 */
	export function addplane (lowx: number, highx: number, lowy: number, highy: number, lowz: number, highz: number) {
		var graph = new Group();
		let oricoord = [lowx, highx, lowy, highy, lowz, highz];
		const threshold = 1.5;

		//do scaling ticks
		let scalex = scaleLinear().domain([lowx, highx]);
		let scaley = scaleLinear().domain([lowy, highy]);
		let scalez = scaleLinear().domain([lowz, highz]);

		// scalex = scaleLinear().domain([Math.min(...scalex.ticks(4)), Math.max(...scalex.ticks(4))]);
		// scaley = scaleLinear().domain([Math.min(...scaley.ticks(4)), Math.max(...scaley.ticks(4))]);
		// scalez = scaleLinear().domain([Math.min(...scalez.ticks(4)), Math.max(...scalez.ticks(4))]);

		//Make the graph ratio look nice
		let deltax = highx - lowx;
		let deltay = highy - lowy;
		let deltaz = highz - lowz;
		let mi = Math.min(deltax, deltay, deltaz);
		if (deltax > mi * threshold) {
			lowx *= mi * threshold / deltax;
			highx *= mi * threshold / deltax;
			deltax = mi * threshold;
		}
		if (deltay > mi * threshold) {
			lowy *= mi * threshold / deltay;
			highy *= mi * threshold /deltay;
			deltay = mi * threshold;
		}

		if (deltaz > mi * threshold) {
			lowz *= mi * threshold / deltaz;
			highz *= mi * threshold / deltaz;
			deltaz = mi * threshold;
		}
		lowx -= 0.1;
		highx += 0.1;
		lowy -= 0.1;
		highy += 0.1;
		lowz -= 0.1;
		highz += 0.1;

		deltax = highx - lowx;
		deltay = highy - lowy;
		deltaz = highz - lowz;

		//start generating plane

		let right = new Vector3(deltaz / 2 , 0, 0);
		let left = new Vector3(-deltaz / 2 , 0, 0);
		let rl = generatePlane(deltax, deltay, scalex, scaley, right, left, false);
		const planeright = rl[0];
		const planeleft = rl[1];
		rl.forEach(function(e){
			e.rotation.y = Math.PI / 2;
		})
		graph.add(...rl);

		let top = new Vector3(0,deltay / -2,0 );
		let bottom = new Vector3(0, deltay / 2, 0);
		let tb = generatePlane(deltaz, deltax, scalez, scalex ,top, bottom, true);
		const planetop = tb[0];
		planetop.name = 'planetop';
		const planebottom = tb[1];
		planebottom.name = 'planebottom';
		tb.forEach(function(e){
			e.rotation.x = Math.PI / 2;
		});
		graph.add( ...tb);


		let front = new Vector3(0,0,deltax / 2);
		let back = new Vector3(0,0,-deltax / 2);
		let fb = generatePlane(deltaz, deltay, scalez, scaley, front, back , false);
		const planefront = fb[0];
		const planeback = fb[1];
		graph.add( ...fb );


		let m = Math.max(deltax, deltay, deltaz) || 1;


		graph.scale.multiplyScalar (0.5 / m);
		const alldelta = [deltax, deltay, deltaz];
		const allscale = [scalex.range([ -deltax/2,  deltax/2]),
						scaley.range([-deltay / 2, deltay / 2]),
						 scalez.range([-deltaz / 2, deltaz / 2])];
		const allplane = [planetop, planebottom, planeleft, planeright, planefront, planeback];
		return new Graph(graph, alldelta, allscale, allplane);
	}

	/**
	 *
	 * helper function to generate a pair of planes
	 *
	 */
	function generatePlane(deltax: number, deltay: number, scalex: ScaleContinuousNumeric<number, number>
		, scaley: ScaleContinuousNumeric<number, number>, posfront: Vector3, posback: Vector3, xy: boolean) {
		const material = new MeshBasicMaterial( {color: 0x0074D9, transparent: true, opacity: 0.3, side: DoubleSide} );
		let geometry = new PlaneGeometry(deltax, deltay);
		let planeback =  new Group()
		planeback.add(new Mesh( geometry, material ));
		planeback.position.copy(posback);


		let smalllinematerial = new LineBasicMaterial({
			color: 0xffffff,
			linewidth: 1
		});

		//Point of the axis
		let xtop = new Geometry();
		let xbottom = new Geometry();
		let yleft = new Geometry();
		let yright = new Geometry();

		let smalllinegeometry = new Geometry();
		let rangex = scalex.range([ -deltax/2,  deltax/2])
		let ticksx = rangex.ticks(4)
		for (let i of ticksx) {
			smalllinegeometry.vertices.push(
				new Vector3(rangex(i), deltay / -2, 0),
				new Vector3(rangex(i), deltay / 2, 0)
				);
			xtop.vertices.push(	new Vector3(rangex(i), deltay / 2, 0))
			xbottom.vertices.push(new Vector3(rangex(i), deltay / -2, 0))
		}

		let rangey = scaley.range([-deltay / 2, deltay / 2])
		let ticksy = rangey.ticks(4);
		for (let i of ticksy) {
			smalllinegeometry.vertices.push(
				new Vector3(-deltax / 2, rangey(i), 0),
				new Vector3(deltax / 2, rangey(i), 0)
				);
			yleft.vertices.push(new Vector3(-deltax / 2, rangey(i), 0));
			yright.vertices.push(new Vector3(deltax / 2, rangey(i), 0));
		}
		let line = new LineSegments(smalllinegeometry, smalllinematerial);

		planeback.add(line);
		const invi = new Material();
		invi.visible = false;
		const xt = new Points(xtop,invi);
		xt.name = "xtop";
		xt.userData = ticksx;
		const xb = new Points(xbottom,invi);
		xb.name = 'xbottom';
		xb.userData = ticksx;
		const yl = new Points(yleft, invi);
		yl.name = 'yleft';
		yl.userData = ticksy;
		const yr = new Points(yright,invi);
		yr.name = 'yright';
		yr.userData = ticksy;
		let count = 0;

		planeback.add(yl,yr);
		if (xy) {
			planeback.add(xt,xb);
		}

		let planefront =  planeback.clone();
		planefront.position.copy(posfront);
		return [planeback, planefront];
	}

	/**
	 *
	 * generate the label for the y-axis. Take in all the side planes
	 *
	 */
	
	export function addyaxis(therest: Group[]) {
		for (let i of therest) {
			const yl = i.getObjectByName("yleft") as Points;
			const yr = i.getObjectByName("yright") as Points;
			const lengtyl = (yl.geometry as Geometry).vertices.length
			const lengthyr = (yr.geometry as Geometry).vertices.length
			let count = 0;
			let tick = yl.userData;
			for (let r of (yl.geometry as Geometry).vertices) {
				const sprite = makeTextSprite(tick[count])
				sprite.position.copy(r).add(new Vector3(-0.2,0,0));
				yl.add(sprite);
				count++
			}
			count = 0;
			for (let r of (yr.geometry as Geometry).vertices) {
				const sprite = makeTextSprite(tick[count])
				sprite.position.copy(r).add(new Vector3(0.2,0,0));
				yr.add(sprite);
				count++
			}
		}
	}

	/**
	 *
	 * generate label for the x and z axis. Take in the top and bottom plane
	 *
	 */
	export function addxzaxis(topbottom: Group[]) {
		for (let i of topbottom) {
			const xt = i.getObjectByName("xtop") as Points;
			const xb = i.getObjectByName("xbottom") as Points;
			const lengtxt = (xt.geometry as Geometry).vertices.length
			const lengthxb = (xb.geometry as Geometry).vertices.length
			const ticksx = xt.userData;
			let count = 0;
			for (let r of (xt.geometry as Geometry).vertices) {
				const sprite = makeTextSprite(ticksx[count])
				sprite.position.copy(r).add(new Vector3(0.2,0.8,0));
				xt.add(sprite);
				count++
			}
			count = 0;
			for (let r of (xb.geometry as Geometry).vertices) {
				const sprite = makeTextSprite(ticksx[count])
				sprite.position.copy(r).add(new Vector3(-0.2,-0.8,0));
				xb.add(sprite);
				count++
			}

			const yl = i.getObjectByName("yleft") as Points;
			const yr = i.getObjectByName("yright") as Points;
			const lengtyl = (yl.geometry as Geometry).vertices.length
			const lengthyr = (yr.geometry as Geometry).vertices.length
			count = 0;
			const ticksy = yl.userData;
			for (let r of (yl.geometry as Geometry).vertices) {
				const sprite = makeTextSprite(ticksy[count])
				sprite.position.copy(r).add(new Vector3(-0.8,0.2,0));
				yl.add(sprite);
				count++
			}
			count = 0;
			for (let r of (yr.geometry as Geometry).vertices) {
				const sprite = makeTextSprite(ticksy[count])
				sprite.position.copy(r).add(new Vector3(0.8,0.2,0));
				yr.add(sprite);
				count++
			}

		}
	}
}
