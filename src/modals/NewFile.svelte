<script lang="ts">
    import { dataWorker } from "../treeStore.svelte";

    let dialog: HTMLDialogElement;

    export function show() {
        dialog.showModal();
    }

    export function close() {
        dialog.close();
    }

    function newTree() {
        dataWorker.postMessage({ type: "new" });
        dialog.close();
    }
</script>

<dialog bind:this={dialog}>
    <h2>New Chart</h2>
    <p>All data will be erased. Don't forget to save a spreadsheet of the data before proceeding. Continue?</p>
    <div class="field">
        <button class="modal-btn" id="new-yes" onclick={newTree}>Yes</button>
        <button class="modal-btn" id="new-no" onclick={close}>No</button>
    </div>
</dialog>

<style>
    dialog {
        border-radius: 8px;
    }

    p {
        margin-top: 0px;
    }

    dialog > div {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .field {
        display: flex;
        flex-direction: row;
        gap: 4px;
    }
</style>