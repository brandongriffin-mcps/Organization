import * as d3 from "d3";
import { flextree, type FlextreeNode } from "d3-flextree";
import DataWorker from "./dataWorker?worker";
import { nodeDragged, nodeDropped } from "./drag";
import type { History } from "./history";
import { OrgNode } from "./types";
import { mouseWheelDelta, onZoom } from "./zoom";

export type HierarchyNode = FlextreeNode<OrgNode>;

export const NODE_WIDTH = 500;

export const NODE_HALF_WIDTH = NODE_WIDTH / 2;

/**
 * Persists the tree to a local SQLite database without blocking the main thread. 
 */
export const dataWorker = new DataWorker(); 

//@ts-ignore
globalThis.dataWorker = dataWorker


/**
 * The global state of the organization chart's hierarchy tree.
 */
export interface Tree {
    /** The SVG that renders the entire chart on the webpage. */
    svg?: SVGSVGElement;
    /** The top level SVG group that is used to zoom and pan the entire chart. */
    container?: SVGGElement;
    /** Handles zooming and panning behavior. */
    zoom: d3.ZoomBehavior<SVGSVGElement, undefined>;
    /** Handles drag and drop behavior for nodes. */
    drag: d3.DragBehavior<SVGGElement, HierarchyNode, HierarchyNode | d3.SubjectPosition>;
    /** The root of the hierarchy before the tree layout is computed. */
    hierarchy: HierarchyNode;
    /** The root node of the hierarchy after the layout has been computed. */
    root: HierarchyNode;
    /** Determines what happens when a node is dragged and dropped onto another node. */
    mode: "Swap" | "Move";
    undoHistory: History[];
    redoHistory: History[];
};

const layout = flextree<OrgNode>({
    children: (data: OrgNode) => data.children,
    nodeSize: (node: d3.HierarchyNode<OrgNode>) => node.data.getSize(),
    spacing: 100
});

const initialHierarchy = layout.hierarchy(new OrgNode(""));

export const tree = $state<Tree>({
    zoom: d3.zoom<SVGSVGElement, undefined>(),
    drag: d3.drag<SVGGElement, HierarchyNode>(),
    hierarchy: initialHierarchy,
    root: layout(initialHierarchy),
    mode: "Swap",
    undoHistory: [],
    redoHistory: []
});

tree.zoom.scaleExtent([0.2, 3])
    .wheelDelta(mouseWheelDelta)
    .on("zoom", onZoom);

tree.drag
    .on("drag", function (e) { nodeDragged(d3.select(this), e); })
    .on("end", function (e) { nodeDropped(d3.select(this), e); });

/**
 * @param mode Switches to the other mode if one isn't provided
 */
export function switchMode(mode?: "Swap" | "Move") {
    if (mode === undefined) {
        // Toggle the mode if one wasn't provided
        tree.mode = (tree.mode === "Swap" ? "Move" : "Swap");
    } else {
        tree.mode = mode;
    }
}

/** Recomputes the tree layout with new data. */
export function recomputeLayout(data: OrgNode = tree.root.data) {
    tree.hierarchy = layout.hierarchy(data);
    tree.root = layout(tree.hierarchy);
}