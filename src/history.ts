import { type HierarchyNode, tree, recomputeLayout, dataWorker } from "./treeStore.svelte";

export interface History {
    type: string;
    node: HierarchyNode;
    parent: HierarchyNode;
    target: HierarchyNode;
    targetParent: HierarchyNode;
    index: number;
}

export function undo() {
    const previousAction = tree.undoHistory.pop();

    if (previousAction === undefined) return;

    const node = tree.root.descendants()
                          .find(n => n.data.name == previousAction.node.data.name)!; 

    const parent = tree.root.descendants()
                            .find(n => n.data.name == previousAction.parent.data.name)!;

    const target = tree.root.descendants()
                            .find(n => n.data.name == previousAction.target.data.name)!;

    switch (previousAction.type) {
        case "MOVE": {
            node.data.moveUnder(parent.data, node.parent!.data);
            parent.data.removeChild(node.data);
            parent.data.insertChild(node.data, previousAction.index);
            dataWorker.postMessage({ 
                type: "move", 
                target: parent.data.name,
                dragged: node.data.name,
                descendants: parent.data.isDescendantOf(node.data)
            });
            break;
        }
        case "SWAP": {
            node.data.swap(target.data, node.parent!.data, target.parent!.data);
            dataWorker.postMessage({ 
                type: "swap", 
                dragged: node.data.name, 
                target: target.data.name
            });
            break;
        }
    }

    tree.redoHistory.push({ 
        type: previousAction.type,
        node, 
        parent, 
        target, 
        targetParent: target.parent!, 
        index: node.parent!.data.children.indexOf(node.data)
    });

    recomputeLayout();
}

export function redo() {
    const previousAction = tree.redoHistory.pop();

    if (previousAction === undefined) return;

    const node = tree.root
                        .descendants()
                        .find(n => n.data.name == previousAction.node.data.name)!; 
    const parent = tree.root
                        .descendants()
                        .find(n => n.data.name == previousAction.parent.data.name)!;
    const target = tree.root
                        .descendants()
                        .find(n => n.data.name == previousAction.target.data.name)!;

    switch (previousAction.type) {
        case "MOVE": {
            node.data.moveUnder(parent.data, node.parent!.data);
            parent.data.removeChild(node.data);
            parent.data.insertChild(node.data, previousAction.index);
            dataWorker.postMessage({ 
                type: "move", 
                target: parent.data.name,
                dragged: node.data.name,
                descendants: parent.data.isDescendantOf(node.data)
            });
            break;
        }
        case "SWAP": {
            node.data.swap(target.data, node.parent!.data, target.parent!.data);
            dataWorker.postMessage({ 
                type: "swap", 
                dragged: node.data.name, 
                target: target.data.name
            });
            break;
        }
    }

    tree.undoHistory.push({ 
        type: previousAction.type,
        node, 
        parent, 
        target, 
        targetParent: target.parent!, 
        index: node.parent!.data.children.indexOf(node.data)
    });

    recomputeLayout();
}

export function canUndo(): boolean {
    return tree.undoHistory.length > 0;
}

export function canRedo(): boolean {
    return tree.redoHistory.length > 0;
}