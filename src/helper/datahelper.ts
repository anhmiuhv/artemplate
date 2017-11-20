import { Vector3, Matrix3 } from 'three'

export class GraphInfo {
	lowx: number;
	highx: number;
	lowy: number;
	highy: number;
	lowz: number;
	highz: number;
	vertices: Vector3[];

	constructor(data: Vector3[]) {
		this.vertices = data.map((d) => {
			return d.clone();
		})
		this.lowx = this.lowy = this.lowz = 2000000000;
		this.highx = this.highy = this.highz = -2000000000;
		for (let i of this.vertices) {
			this.lowx = Math.min(this.lowx, i.x);
			this.lowy = Math.min(this.lowy, i.y);
			this.lowz = Math.min(this.lowz, i.z);
			this.highx = Math.max(this.highx, i.x);
			this.highy = Math.max(this.highy, i.y);
			this.highz = Math.max(this.highz, i.z);
		}

		this.lowx = Math.floor(this.lowx);
		this.lowy = Math.floor(this.lowy);
		this.lowz = Math.floor(this.lowz);
		this.highx = Math.ceil(this.highx);
		this.highy = Math.ceil(this.highy);
		this.highz = Math.ceil(this.highz);
		if (this.highx === this.lowx) {
			this.highx += 1;
			this.lowx -= 1;
		}
		if (this.highy === this.lowy) {
			this.highy += 1;
			this.lowy -= 1;
		}
		if (this.highz === this.lowz) {
			this.highz += 1;
			this.lowz -= 1;
		}
	}
} 