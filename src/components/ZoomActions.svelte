<script lang="ts">
  let zoomActions: HTMLDivElement;
  let zoomTooltip: HTMLDivElement;

  import zoominUrl from "@icons/zoomin.svg";
  import zoomoutUrl from "@icons/zoomout.svg";
  import * as d3 from "d3";
  import { tree } from "../treeStore.svelte";
  import { resetZoom, zoomIn, zoomOut } from "../zoom";

  function onTooltipHover(_: MouseEvent | FocusEvent) {
    const rect = zoomActions.getBoundingClientRect();
    zoomTooltip.style.top = `${rect.top - 40}px`;
    zoomTooltip.style.left = `${rect.left + rect.width / 2}px`;
    zoomTooltip.style.display = "block";
  }

  function hideTooltip() {
    zoomTooltip.style.display = "none";
  }

  let percent = $state<number>(100);

  tree.zoom.on("zoom.ui", function(e: d3.D3ZoomEvent<SVGSVGElement, undefined>) {
    percent = Math.fround(e.transform.k * 100);
  });
  </script>

<div class="zoom-tooltip" role="tooltip" bind:this={zoomTooltip}>Reset Zoom</div>
<div class="zoom-actions" bind:this={zoomActions}>
    <button 
      onclick={() => zoomOut()} 
      class={percent <= 20 ? "disabled" : "clickable"}
    >
        <img src={zoomoutUrl} width="20" height="20" alt="Zoom Out"/>
    </button>
    <button 
      onfocus={onTooltipHover}
      onmouseover={onTooltipHover} 
      onmouseleave={hideTooltip}
      onclick={() => resetZoom()} 
      class="zoom-label">
      {`${percent}%`}
    </button>
    <button 
      onclick={() => zoomIn()} 
      class={percent >= 300 ? "disabled" : "clickable"}
    >
        <img src={zoominUrl} width="20" height="20" alt="Zoom In"/>
    </button>
</div>

<style>
.zoom-actions {
  background-color: white;
  box-shadow: 1px 1px 4px black;
  border-radius: 8px;
  display: flex;
  overflow: hidden;
  align-items: center;
}

.zoom-actions button {
  border: none;
  background-color: transparent;
  padding: 0.5em 1em;
  height: 100%;
}

.clickable {
  cursor: pointer;
}

.zoom-actions .clickable:hover {
  background-color: #aaa;
}

.zoom-tooltip {
  display: none;
  position: fixed;
  background-color: black;
  color: white;
  font-size: 0.8rem;
  padding: 8px;
  border-radius: 8px;
  transform: translateX(-50%);
}

.zoom-label {
  width: 3.75rem;
  text-align: center;
  cursor: pointer;
}

.disabled {
    filter: opacity(30%);
}
</style>