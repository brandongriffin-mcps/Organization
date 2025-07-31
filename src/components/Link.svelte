<script lang="ts">
    import * as d3 from 'd3';
    import type { OrgNode } from "../types";

    const linkGenerator = d3.link<d3.HierarchyLink<OrgNode>, [number, number]>(d3.curveStepBefore)
        .source(d => [d.source.x!, d.source.y!])
        .target(d => [d.target.x!, d.target.y!]);

    let { d }: { d: d3.HierarchyLink<OrgNode>} = $props();

    let pathRef: SVGPathElement;

    $effect(() => {
        d3.select(pathRef)
            .datum(d);
    });
</script>


<path 
    fill="none" 
    stroke="#aaa" 
    stroke-width="1.5"
    d={linkGenerator(d)}
    bind:this={pathRef}
></path>