import {Graph} from "./planehelper"
import {GraphInfo} from "./datahelper"
import { Points, PointsMaterial, BufferAttribute, BufferGeometry, Scene, DirectionalLight, AmbientLight, SphereGeometry, MeshLambertMaterial, Mesh} from 'three'

export namespace RenderHelper {
    /**
     * Render sphere
     * @param scene scene object
     * @param graphinfo graph info object
     * @param graph graph object
     */
    export function renderSphere(scene: Scene, graphinfo: GraphInfo, graph: Graph) {
        var directionalLight = new DirectionalLight( 0xffffff, 0.5 );
        scene.add(directionalLight);
        var light = new AmbientLight( 0x404040, 0.8 ); // soft white AmbientLight
        scene.add( light );
        var geometry = new SphereGeometry(0.015 /  graph.scaleFactor,20,20 ,0, Math.PI * 2, 0, Math.PI * 2);
        var material = new MeshLambertMaterial({color: 0xd3d3d3});
        
        let pos = graph.getVerticesForDisplay(graphinfo.vertices);
        var count = 0;
        for ( let i of pos ) {
            var mesh = new Mesh( geometry, material );
            mesh.name = "sphere " + count;
            mesh.position.set( i.x, i.y, i.z);
            mesh.userData = Object.assign(mesh,mesh.userData, {oriData: graphinfo.vertices[count]});
            graph.graph.add( mesh );
            count++;
        }
    }

    /**
     * render points cloud
     * @param scene scene object
     * @param graphinfo graph info object
     * @param graph graph object
     */
    export function renderPoints(scene: Scene, graphinfo: GraphInfo, graph: Graph) {
        let geometry = new BufferGeometry();
        const array = (<number[]>[]).concat(...graph.getVerticesForDisplay(graphinfo.vertices).map((v)=> {
            return v.toArray();
        }));
        geometry.addAttribute('position', new BufferAttribute(array, graphinfo.vertices.length));
        let mat = new PointsMaterial({ size:0.05, color: 0x7FDBFF });
        let particles = new Points( geometry , mat );
        graph.graph.add(particles);
    }
}