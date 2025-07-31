<script lang="ts">
    import moveUrl from "@icons/move.svg";
    import swapUrl from "@icons/swap.svg";

    import { switchMode, tree } from "../treeStore.svelte";
</script>

<div class="tab-bar">
    <button 
        onclick={() => { switchMode("Swap") }}
        class={tree.mode === "Swap" ? "active" : ""}
    >
        <img src={swapUrl} width="20" height="20" alt="Swap" />
        Swap
    </button>
    <button 
        onclick={() => { switchMode("Move") }}
        class={ tree.mode === "Move" ? "active" : ""}
    >
        <img src={moveUrl} width="20" height="20" alt="Move" />
        Move
    </button>
</div>

<style>
.tab-bar img {
    width: 20px;
    height: 20px;
}

.tab-bar {
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    background-color: #eee;
    padding: 0.2em;
    box-shadow: 1px 1px 4px black;
}

.tab-bar button {
    padding: 0.5em;
    border: none;
    background-color: transparent;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.active {
    background-color: white !important;
    box-shadow: 0px 0px 5px #DDDDDD;
}
</style>