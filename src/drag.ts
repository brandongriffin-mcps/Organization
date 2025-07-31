import * as d3 from "d3";
import type { RequestMessage } from "./dataWorker";
import { type History } from "./history";
import { dataWorker, NODE_HALF_WIDTH, recomputeLayout, tree, type HierarchyNode } from "./treeStore.svelte";
import { OrgNode } from "./types";

const MAX_DISTANCE = 1000;
const PAN_SPEED = 25;
const EDGE_PADDING = 10;

let keepPanning = false;
let panVector = {x: 0, y: 0};

function autoPan() {
    if (keepPanning === false) return;

    setTimeout(() => {
        tree.zoom.translateBy(
            d3.select(tree.svg!),
            -panVector.x * PAN_SPEED,
            -panVector.y * PAN_SPEED
        );
        autoPan();
    }, 10);
}

/**
 * Gets the closest node in the hierarchy relative to a given node.
 * @param node The node's SVG element (often the node being dragged by the user)
 * @returns An array containing the closest node and the distance to that node
 */
function getClosestNode(node: d3.Selection<SVGGElement, HierarchyNode, null, undefined>): [HierarchyNode | null, number] {
    let dist = Infinity;
    let closest = null;

    const transform = node.attr("transform").match(/-?[\.\d]+/g)!;
    const x = parseFloat(transform[0]) + NODE_HALF_WIDTH;
    const y = parseFloat(transform[1]);

    for (const n of tree.root.descendants()) {
        const cdist = Math.sqrt((n.x! - x) ** 2 + (n.y! - y) ** 2);

        if (cdist < dist) {
            dist = cdist;
            closest = n;
        }
    }

    return [closest, dist];
}

/**
 * Fires when a node is being dragged by the user.
 * @param node A d3 selection of the node being dragged
 * @param e The drag event object
 */
export function nodeDragged(node: d3.Selection<SVGGElement, HierarchyNode, null, undefined>, e: d3.D3DragEvent<SVGGElement, OrgNode, HierarchyNode>) {
    if (e.subject === tree.root) {
        return;
    }

    if (node.classed("dragging") === false) {
        node.classed("dragging", true);
    }

    if (e.sourceEvent instanceof MouseEvent) {
        if (e.sourceEvent.clientX >= window.innerWidth - EDGE_PADDING) {
            panVector.x = 1;
        } else if (e.sourceEvent.clientX <= 0) {
            panVector.x = -1;
        } else {
            panVector.x = 0;
        }

        if (e.sourceEvent.clientY >= window.innerHeight - EDGE_PADDING) {
            panVector.y = 1;
        } else if (e.sourceEvent.clientY <= 0) {
            panVector.y = -1;
        } else {
            panVector.y = 0;
        }
    }

    if ((panVector.x != 0 || panVector.y != 0) && keepPanning == false) {
        keepPanning = true;
        autoPan();
    }

    const transform = node.attr("transform").match(/-?[\d\.]+/g)!;
    const x = parseFloat(transform[0]);
    const y = parseFloat(transform[1]);

    d3.selectAll(".node").classed("closest", false);

    const selection = d3.select(tree.container!)
        .selectAll<SVGGElement, HierarchyNode>(".node")
        .sort((a, b) => {
            const aDist = Math.sqrt((a.x! - (x + NODE_HALF_WIDTH)) ** 2 + (a.y! - y) ** 2);
            const bDist = Math.sqrt((b.x! - (x + NODE_HALF_WIDTH)) ** 2 + (b.y! - y) ** 2);
            return aDist - bDist;
        });

    d3.select<SVGGElement, HierarchyNode>(selection.node()!)
        .filter(d => Math.sqrt((d.x - x) ** 2 + (d.y - y) ** 2) < MAX_DISTANCE)
        .filter(d => d.data.name != e.subject.data.name)
        .classed("closest", true);

    node.raise();
    node.attr("transform", `translate(${x + e.dx},${y + e.dy})`);
}

/**
 * Fires when a user lets go of a node that was being dragged.
 * @param node A d3 selection of the node that was being dragged
 * @param e The drag event object
 */
export function nodeDropped(node: d3.Selection<SVGGElement, HierarchyNode, null, undefined>, e: d3.D3DragEvent<SVGGElement, OrgNode, HierarchyNode>) {
    const dragged = e.subject;

    if (dragged === tree.root) {
        return;
    }

    keepPanning = false;

    d3.select(".dragging").classed("dragging", false);
    d3.selectAll(".node").classed("closest", false);

    const [closest, distance] = getClosestNode(node);

    if (closest === null) {
        console.error("Closest node not found!");
        return;
    }

    if (closest != dragged && distance < MAX_DISTANCE) {
        const record: History = {
            type: "",
            node: dragged,
            parent: dragged.parent!,
            target: closest,
            targetParent: closest.parent!,
            index: dragged.parent!.data.children.indexOf(dragged.data)
        };

        if (tree.mode === "Move" || closest === tree.root) {
            record.type = "MOVE";
            dragged.data.moveUnder(closest.data, dragged.parent!.data);
            dataWorker.postMessage({ 
                type: "move", 
                target: closest.data.name, 
                dragged: dragged.data.name,
                descendants: closest.data.isDescendantOf(dragged.data)
            } as RequestMessage);
        } else {
            record.type = "SWAP";
            dragged.data.swap(closest.data, dragged.parent!.data, closest.parent!.data);
            dataWorker.postMessage({ 
                type: "swap", 
                dragged: dragged.data.name, 
                target: closest.data.name
            } as RequestMessage);
        }

        tree.undoHistory.push(record);
    }

    node.attr("transform", d => `translate(${d.x - NODE_HALF_WIDTH},${d.y})`);

    recomputeLayout();
}