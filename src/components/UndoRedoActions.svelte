<script lang="ts">
    import redoUrl from "@icons/redo.svg";
    import undoUrl from "@icons/undo.svg";

    import { canRedo, canUndo, redo, undo } from "../history";
</script>

<div class="bar">
    <button 
        class={ canUndo() ? "clickable" : "disabled"}
        onclick={() => { undo() }}
    >
        <img src={undoUrl} width="20" height="20" alt="Undo">
    </button>
    <button 
        class={ canRedo() ? "clickable" : "disabled"}
        onclick={() => { redo() }}
    >
        <img src={redoUrl} width="20" height="20" alt="Redo">
    </button>
</div>

<style>
    .bar {
        display: flex;
        flex-direction: row;
        box-shadow: 1px 1px 4px black;
        border-radius: 8px;
        overflow: hidden;
        background-color: white;
    }

    .bar button {
        border: none;
        background-color: transparent;
        padding: 0.5em 1em;
    }

    .clickable {
        cursor: pointer;
    }

    .bar .clickable:hover {
        background-color: #aaa;
    }

    .disabled {
        filter: opacity(30%);
    }
</style>