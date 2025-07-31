import ExcelJS from "exceljs";
import { NODE_HALF_WIDTH, tree, type HierarchyNode } from "./treeStore.svelte";
import type { SheetHierarchy, SheetPosition } from "./types";

/**
 * Returns the X value of the leftmost node.
 * 
 * Used to center the diagram when exporting it.
 * @param node Start with the root node
 * @param x Start with 0
 */
export function getLeftmostXValue(node: HierarchyNode, x: number = 0): number {
    if (!node.children) {
        return node.x < x ? node.x - NODE_HALF_WIDTH : x;
    }

    let leftX = 0;
    for (const child of node.children) {
        let currX = getLeftmostXValue(child, child.x - NODE_HALF_WIDTH < x ? child.x - NODE_HALF_WIDTH : x);

        if (currX < leftX) {
            leftX = currX;
        }
    }
    return leftX;
}

/**
 * Downloads a file using the trick where a temporary link element is clicked.
 * @param name 
 * @param url 
 */
export function downloadFile(name: string, url: string) {
    const a = document.createElement("a");
    a.download = name;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Dumps the chart's SVG document into a file and downloads it.
 * @param name The name the downloaded file should have
 */
export function downloadSVG(name: string) {
    const chartSize = tree.container!.getBBox();
    const leftX = getLeftmostXValue(tree.root, 0);

    const capturedSvg = tree.svg!.cloneNode(true) as SVGSVGElement;
    capturedSvg.setAttribute("width", chartSize.width.toString());
    capturedSvg.setAttribute("height", chartSize.height.toString());
    capturedSvg.setAttribute("viewBox", `${leftX},0,${chartSize.width},${chartSize.height}`)

    const capturedContainer = capturedSvg.getElementsByTagName("g")[0] as SVGGElement;
    capturedContainer.setAttribute("transform", "translate(0,0) scale(1)");

    const svgBlob = new Blob([capturedSvg.outerHTML], {
            type: "image/svg+xml"
    });
    
    const downloadUrl = URL.createObjectURL(svgBlob);

    downloadFile(name, downloadUrl);

    URL.revokeObjectURL(downloadUrl);
}

/**
 * Renders the entire chart in a canvas then saves the canvas as a PNG.
 * @param name The name the downloaded file should have
 */
export function downloadPNG(name: string) {
    const chartSize = tree.container!.getBBox();
    const leftX = getLeftmostXValue(tree.root, 0);

    const capturedSvg = tree.svg!.cloneNode(true) as SVGSVGElement;
    capturedSvg.setAttribute("width", chartSize.width.toString());
    capturedSvg.setAttribute("height", chartSize.height.toString());
    capturedSvg.setAttribute("viewBox", `${leftX},0,${chartSize.width},${chartSize.height}`)

    const capturedContainer = capturedSvg.getElementsByTagName("g")[0] as SVGGElement;
    capturedContainer.removeAttribute("transform");

    const canvas = document.createElement("canvas");
    canvas.width = chartSize.width;
    canvas.height = chartSize.height;

    const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;

    const svgBlob = new Blob([capturedSvg.outerHTML], { type: "image/svg+xml" })

    const img = document.createElement("img");
    img.src = URL.createObjectURL(svgBlob);
    img.onload = function () {
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(blob => {
            const downloadUrl = URL.createObjectURL(blob!);

            downloadFile(name, downloadUrl);

            URL.revokeObjectURL(downloadUrl);
        });
    }
}

/**
 * Dumps all the data into an Excel workbook then downloads the workbook.
 * 
 * The Hierarchy sheet stores which offices are under each other, and the Positions sheet stores all the employee information.
 * @param name The name the downloaded file should have
 * @see https://github.com/exceljs/exceljs/blob/master/README.md#contents
 */
export function downloadXLSX(name: string) {
    const hierarchyRows: SheetHierarchy[] = [];
    const positionRows: SheetPosition[] = [];

    // Traverses the entire tree recursively to extract all of the data 
    const extractTree = (node: HierarchyNode) => {
        hierarchyRows.push({ 
            name: node.data.name,
            parent: node.parent?.data.name ?? ""
        });

        if (node.data.positions) {
            for (const position of node.data.positions) {
                positionRows.push({ title: position.title, fte: position.fte, office: node.data.name, ideaFunded: position.ideaFunded });
            }
        }

        if (node.children) {
            for (const child of node.children) {
                    extractTree(child);
            }
        }
    };

    extractTree(tree.root);

    const headerStyle: Partial<ExcelJS.Style> = {
            alignment: {
                horizontal: "center"
            },
            font: { bold: true }
    };

    const workbook = new ExcelJS.Workbook();

    const hierarchySheet = workbook.addWorksheet("Hierarchy");

    const maxNameWidth = hierarchyRows.reduce((w, r) => Math.max(w, r.name.length), 10);
    const maxParentWidth = hierarchyRows.reduce((w, r) => Math.max(w, r.parent.length), 10);

    hierarchySheet.columns = [
            { 
                header: "Name", 
                key: "name", 
                width: maxNameWidth, 
            },
            { 
                header: "Parent", 
                key: "parent", 
                width: maxParentWidth,
            }
    ];

    hierarchySheet.getCell("A1").style = headerStyle;
    hierarchySheet.getCell("B1").style = headerStyle;

    hierarchySheet.addRows(hierarchyRows);

    const positionsSheet = workbook.addWorksheet("Positions");

    const maxTitleWidth = positionRows.reduce((w, r) => Math.max(w, r.title.length), 10);
    const maxOfficeWidth = positionRows.reduce((w, r) => Math.max(w, r.office.length), 10);

    positionsSheet.columns = [
            { 
                header: "Title", 
                key: "title", 
                width: maxTitleWidth, 
            },
            { 
                header: "Full-Time Equivalent", 
                key: "fte", 
                width: 20,
            },
            {
                header: "Office",
                key: "office",
                width: maxOfficeWidth
            },
            {
                header: "IDEA Grant Funded",
                key: "ideaFunded",
                width: 20
            }
    ];

    positionsSheet.getCell("A1").style = headerStyle;
    positionsSheet.getCell("B1").style = headerStyle;
    positionsSheet.getCell("C1").style = headerStyle;
    positionsSheet.getCell("D1").style = headerStyle;

    positionsSheet.addRows(positionRows);

    workbook.xlsx.writeBuffer().then(buffer => {
        const xlsxBlob = new Blob([buffer], { 
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
        });

        const downloadUrl = URL.createObjectURL(xlsxBlob);

        downloadFile(name, downloadUrl);

        URL.revokeObjectURL(downloadUrl);
    });
}