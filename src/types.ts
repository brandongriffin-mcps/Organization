import { NODE_WIDTH } from "./treeStore.svelte";

/** A position in an office. */
export interface Position {
  title: string;
  /** Full-time equivalent */
  fte: number;
  /** Is this position funded by the IDEA grant? */
  ideaFunded: boolean;
}

/** 
 * A node in a pure JSON representation of the tree. 
 */
interface NodeData {
  name: string;
  children?: NodeData[];
  positions?: Position[];
}

/**
 * A parsed row in the Hierarchy sheet of the workbook.
 */
export interface SheetHierarchy {
    name: string;
    parent: string;
}

/**
 * A parsed row in the Positions sheet of the workbook.
 */
export interface SheetPosition {
    title: string;
    fte: number;
    office: string;
    ideaFunded: boolean;
}

/**
 * A node for an office in the organization hierarchy.
 */
export class OrgNode {
    /** The name of this office. */
    name: string;
    /** A list of offices that are directly under this one. */
    children: OrgNode[];
    /** A list of positions in this office with their respective full-time equivalents. */
    positions: Position[];

    constructor(rootName: string) {
        this.name = rootName;
        this.children = [];
        this.positions = [];
    }

    /**
     * Parses a tree of OrgNodes from JSON data.
     * @param data The root node of the JSON data
     * @returns The root OrgNode of the parsed tree
     */
    static fromJSON(data: NodeData): OrgNode {
        const root = new OrgNode(data.name);
        root.positions = data.positions ?? [];
        OrgNode.#parseChildren(root, data);
        return root;
    }

    /**
     * Recursively parses the tree of data into a tree of OrgNodes
     * @param node This should be the root node for the first call
     * @param data This should be the root node's data for the first call
     * @private
     */
    static #parseChildren(node: OrgNode, data: NodeData) {
        if (data.children === undefined || data.children.length === 0) return;

        for (const child of data.children) {
            const childNode = node.addChild(child.name);
            childNode.positions = child.positions ?? [];
            OrgNode.#parseChildren(childNode, child);
        }
    }

    insertChild(node: OrgNode, index?: number) {
        if (index !== undefined) {
            this.children.splice(index, 0, node);
        } else {
            this.children.push(node);
        }
    }

    removeChild(node: OrgNode) {
        const idx = this.children.indexOf(node);

        if (idx > -1) {
            this.children.splice(idx, 1);
        }
    }

    isDescendantOf(ancestor: OrgNode) {
        if (ancestor.children.indexOf(this) > -1) return true;
        if (ancestor.children.length == 0) return false;

        for (const child of ancestor.children) {
            let result = this.isDescendantOf(child);

            if (result === true) {
                return true;
            }
        }

        return false;
    }

    /**
     * A builder method that adds a child node.
     * @param name The name of the child node
     */
    addChild(name: string): OrgNode {
        const child = new OrgNode(name);
        this.children?.push(child);
        return child; 
    }

    /**
     * A builder method that adds a position.
     * @param title The position's title
     * @param fte The position's full-time equivalent
     * @param ideaFunded Is this position funded by the IDEA grant?
     */
    addPosition(title: string, fte: number, ideaFunded: boolean): OrgNode {
        this.positions.push({title, fte, ideaFunded});
        return this;
    }

    /**
     * A builder method that sets the name of the office.
     * @param name The name of the office
     */
    setName(name: string): OrgNode {
        this.name = name;
        return this;
    }

    /**
     * Calculates the size of this node for the flexible tree layout algorithm.
     * @returns An array that contains the width and height of this node
     */
    getSize(): [number, number] {
        return [
            NODE_WIDTH,
            150 + 30 * (this.positions?.length || 0)
        ];
    }

    /**
     * Moves this node under the target node
     * @param target The node to move this node under
     * @param parent The parent of this node
     */
    moveUnder(target: OrgNode, parent: OrgNode) {
        if (target.children.indexOf(this) > -1) {
            return;
        }

        if (target.isDescendantOf(this)) {
            parent.removeChild(this);

            const oldChildren = this.children.slice();

            this.children = [];

            target.insertChild(this);

            for (const child of oldChildren) {
                parent.insertChild(child);
            }
        } else {
            parent.removeChild(this);
            target.insertChild(this);
        }
    }

    /**
     * Swaps the dragged and closest node in the tree
     * @param target The node to swap places with
     * @param parent The parent of this node
     * @param targetParent The parent of the target node
     */
    swap(target: OrgNode, parent: OrgNode, targetParent: OrgNode) {
        const oldIdx = parent.children.indexOf(this);
        const oldTargetIdx = targetParent.children.indexOf(target);

        this.removeChild(target);
        target.removeChild(this);

        const oldChildren = this.children.slice();
        const targetChildren = target.children.slice();

        parent.removeChild(this);
        targetParent.removeChild(target);

        this.children = targetChildren;
        target.children = oldChildren;

        if (parent == target) {
            this.insertChild(target, oldIdx);
        } else {
            parent.insertChild(target, oldIdx);
        }

        if (targetParent == this) {
            target.insertChild(this, oldTargetIdx);
        } else {
            targetParent.insertChild(this, oldTargetIdx);
        }
    }
}
