import * as d3 from "d3";
import { tree, type HierarchyNode } from "./treeStore.svelte"

export function onZoom(e: d3.D3ZoomEvent<SVGSVGElement, undefined>) {
    tree.container!.setAttribute("transform", e.transform.toString())
}

export function mouseWheelDelta(event: WheelEvent) {
    const k = d3.zoomTransform(tree.svg!).k;
    // Hacks around d3's k * 2^d foruma to force the scale factor 
    // to change by +/- 0.1 (+/- 10% zoom)
    return Math.log2((k + (Math.sign(-event.deltaY) * 0.1)) / k);
}

export function centerViewOnNode(node: HierarchyNode = tree.root) {
    tree.zoom.scaleTo(d3.select(tree.svg!), 1);
    tree.zoom.translateTo(d3.select(tree.svg!), node.x!, node.y! + node.data.getSize()[1] / 2);
}

/**
 * Zooms in 10% at the center of the view.
 */
export function zoomIn() {
    tree.zoom.scaleTo(d3.select(tree.svg!), d3.zoomTransform(tree.container!).k + 0.1);
}

/**
 * Zooms out 10% at the center of the view.
 */
export function zoomOut() {
    tree.zoom.scaleTo(d3.select(tree.svg!), d3.zoomTransform(tree.container!).k - 0.1);
}

/**
 * Resets the zoom to 100%.
 */
export function resetZoom() {
    tree.zoom.scaleTo(d3.select(tree.svg!), 1);
}