<script lang="ts">
    import * as d3 from "d3";
    import type { ResponseMessage } from "../dataWorker";
    import { dataWorker, recomputeLayout, tree } from "../treeStore.svelte";
    import { OrgNode } from "../types";
    import ActionsBar from "./ActionsBar.svelte";
    import Link from './Link.svelte';
    import Node from './Node.svelte';

    let transform = $state("translate(0,0) scale(1)");
    let loading = $state(true);

    dataWorker.addEventListener("message", function(e: MessageEvent<ResponseMessage>) {
        if (e.data.type === "tree") {
            let data = OrgNode.fromJSON(e.data.tree);
            recomputeLayout(data);
            loading = false;
        }
    });

    $effect(() => {
      if (loading === false) {
        d3.select<SVGSVGElement, undefined>(tree.svg!)
          .call(tree.zoom)
          .on("dblclick.zoom", null);
      }

      dataWorker.postMessage({ type: "getTree" });
    });
</script>

<main>
  <svg bind:this={tree.svg} xmlns="http://www.w3.org/2000/svg" class={`org-chart ${loading === true ? "loading" : ""}`}>
      {#if loading === false}
      <g bind:this={tree.container} class="container" transform={transform}>
          <g class="links">
            {#each tree.root.links() as path (path.target.data.name)}
              <Link d={path} />
            {/each}
          </g>
          <g class="nodes" role="tree">
            {#each tree.root.descendants() as d (d.data.name)}
              <Node d={d} />
            {/each}
          </g>
      </g>
      {/if}
  </svg>
  <ActionsBar />
</main>

<style>
main {
  display: contents;
}

svg {
  width: 100%;
  height: 100%;
}

.loading {
  animation-name: pulse;
  animation-duration: 1s;
  animation-iteration-count: infinite;
}

@keyframes pulse {
  0% {
    background-color: #fff;
  }

  50% {
    background-color: #dbdbdb;    
  }

  100% {
    background-color: #fff;
  }
}
</style>