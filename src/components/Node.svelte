<script lang="ts">
    import * as d3 from 'd3';
    import { sineInOut } from 'svelte/easing';
    import { Tween } from 'svelte/motion';
    import { type HierarchyNode, NODE_HALF_WIDTH, NODE_WIDTH, tree } from '../treeStore.svelte';
    import { wrap } from '../wrap';
    import { centerViewOnNode } from '../zoom';

    let { d }: { d: HierarchyNode } = $props();

    const tweenOptions = { delay: 0, duration: 250, easing: sineInOut };

    let x = new Tween(d.x, tweenOptions);
    let y = new Tween(d.y, tweenOptions);

    let titleRef: SVGTextElement;
    let nodeRef: SVGGElement;

    $effect(() => {
        x.target = d.x;
        y.target = d.y;

        // Only set up the drag behavior for nodes that aren't draggable yet
        d3.select<SVGGElement, HierarchyNode>(nodeRef)
            .datum(d) // Allows the data to be accessed in a D3 selection later
            .filter("g:not(.draggable)")
            .call(tree.drag)
            .classed("dragged", true);

        // Wraps the title text only one time
        d3.select<SVGTextElement, undefined>(titleRef)
            .filter("text:not(.wrapped)")
            .call(wrap, NODE_WIDTH - 20, 0, 1.2, 1, false, true)
            .classed("wrapped", true);
    });

    function focusNode() {
        centerViewOnNode(d);
    }
</script>

<g 
    transform={`translate(${x.current - NODE_HALF_WIDTH},${y.current})`} 
    class="node" 
    bind:this={nodeRef}
    ondblclick={(e) => { focusNode() }}
    role="treeitem"
    aria-selected="false"
    tabindex="0"
>
    <rect 
        fill="#fff" 
        stroke="#000" 
        stroke-width="4" 
        width={NODE_WIDTH}
        height={(d.data?.positions?.length || 0) * 32 + 95}
        rx="8px"
        ry="8px"
    ></rect>
    <text
        bind:this={titleRef}
        text-anchor="middle"
        dominant-baseline="middle"
        x=250
        y=35
        font-family="'Geist', sans-serif"
        font-weight="bold"
        font-size="24px"
    >{d.data.name}</text>
    {#if d.data.positions.length > 0}
    <rect
        x=12.5
        y=75
        width={NODE_WIDTH - 25}
        height="2px"
    ></rect>
    {/if}
    {#each d.data.positions as position, i}
    <text
        x=12.5
        y={105 + (i * 30)}
        font-family="'Geist', sans-serif"
    >{position.title}</text>
    <text
        x={NODE_WIDTH - 12.5}
        y={105 + (i * 30)}
        font-family="'Geist', sans-serif"
        text-anchor="end"
    >{`${parseInt(position.fte.toString()) === position.fte ? position.fte.toFixed(1) : position.fte}`}<tspan fill={position.ideaFunded ? "" : "transparent"}>*</tspan>
    </text>
    {/each}
</g>

<style>
.node {
  user-select: none;
  cursor: move;
}
</style>