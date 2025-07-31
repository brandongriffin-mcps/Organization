<script lang="ts">
    import { dataWorker } from "../treeStore.svelte";
    import { OrgNode } from "../types";
    import type { ResponseMessage } from "../dataWorker";

    let modal: HTMLDialogElement;
    let error = $state<string>("");
    let tree = $state<OrgNode>();

    let badHierarchyRows = $state<{ row: number; data: string[]; }[]>([]);
    let badPositionRows = $state<{ row: number; data: string[]; }[]>([]);

    let activeTab = $state<string>("Hierarchy");

    dataWorker.addEventListener("message", function(e: MessageEvent<ResponseMessage>) {
        switch (e.data.type) {
        case "openError":
            error = e.data.message;
            modal.showModal();
            break;

        case "openMissingData":
            badHierarchyRows = e.data.hierarchy;
            badPositionRows = e.data.positions;
            modal.showModal();
            break;
        }
    });

    export function show() {
        error = '';
        badHierarchyRows = [];
        badPositionRows = [];
        tree = undefined;

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        fileInput.showPicker();

        fileInput.addEventListener("change", async function() {
            dataWorker.postMessage({ 
                type: "open", 
                buffer: await fileInput.files![0].arrayBuffer() 
            });
            fileInput.remove();
        });
    }

    export function close() {
        modal.close();
    }
</script>

{#snippet dataTable(headers: string[], data: { row: number; data: string[]; }[])}
    <table>
        <thead>
            <tr>
                <th></th>
                {#each headers as header}
                <th>{header}</th>
                {/each}
            </tr>
        </thead>
        <tbody>
            {#each data as row}
            <tr>
                <td>{row.row}</td>
                {#each row.data as cell}
                <td class={cell === "" ? "missing" : ""}>{cell}</td>
                {/each}
            </tr>
            {/each}
        </tbody>
    </table>
{/snippet}

<dialog bind:this={modal}>
    {#if error !== ""}
        <h2>Error</h2>
        <p>{error}</p>
        <button onclick={close} class="modal-btn">Close</button>
    {:else}
        <h2>Error</h2>
        <p>Could not build the organization chart due to incomplete data. Open your spreadsheet, fill in the following rows, and try again:</p>
        <div class="container">
            <div role="tabpanel" class="table-wrapper">
            {#if activeTab === "Hierarchy"}
                {@render dataTable(["Name", "Parent"], badHierarchyRows)}
            {:else}
                {@render dataTable(["Title", "F.T.E.", "Office", "IDEA Grant Funded"], badPositionRows)}
            {/if}
            </div>
            <div role="tablist" class="tab-bar">
                <button role="tab" onclick={() => { activeTab = "Hierarchy"; }} class="{activeTab === "Hierarchy" ? "active" : ""}">Hierarchy</button>
                <button role="tab" onclick={() => { activeTab = "Positions"; }} class="{activeTab === "Positions" ? "active" : ""}">Positions</button>
            </div>
        </div>
        <div class="field">
            <button onclick={close} class="modal-btn">Close</button>
        </div>
    {/if}
</dialog>

<style>
.table-wrapper {
    height: 16em;
    overflow-y: auto;
}

thead {
    border: 1px solid gray;
    background-color: #fff;
    position: sticky;
    top: 0;
    z-index: 2;
}

table {
  width: 100%;
}

table, tr, th, td {
  border: 1px solid gray;
  border-collapse: collapse;
}

th, td {
  padding: 0em 0.5em;
}

th:nth-child(1) {
  background-color: #E6E6E6;
  padding: 0em 0.2em;
  width: 1%;
}

td:nth-child(1) {
  padding: 0em 0.2em;
  width: 1%;
  text-align: center;
  background-color: #E6E6E6;
}

.field {
    margin-top: 1rem;
}

.missing {
    color: #F44336;
}

.missing::after {
    content: "MISSING";
}

.tab-bar {
  background-color: #E6E6E6;
  display: flex;
  gap: 0;
  padding-bottom: 4px;
  padding-left: 3.5em;
}

.tab-bar button {
  font-size: 0.875rem;
  background-color: transparent;
  border: none;
  margin: 0;
  padding: 0px 1em 0.2em 1em;
}

.tab-bar button:hover {
  font-weight: bold;
}

.active {
  background-color: #FAFAFA !important;
  color: #217346;
  border-bottom: 2px solid #217346 !important;
  border-left: 1px solid black !important;
  border-right: 1px solid black !important;
  font-weight: bold;
}
</style>