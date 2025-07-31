<script lang="ts">
    import employeeUrl from "@icons/employee.svg";
    import officeUrl from "@icons/office.svg";
    import type { ResponseMessage } from "../dataWorker";
    import { dataWorker, tree, type HierarchyNode } from "../treeStore.svelte";
    import { centerViewOnNode } from "../zoom";

    type SearchResult = 
        | { type: "offices"; name: string; parent: string; }
        | { type: "positions"; title: string; fte: number; office: string; grant: number; };

    type SearchType = SearchResult["type"];

    let modal: HTMLDialogElement;
    let query: string = $state("");
    let searchType = $state<SearchType>("positions");
    let results = $state<SearchResult[]>([]);
    let searchRef: HTMLInputElement;
    
    export function show() {
        query = '';
        results = [];
        modal.showModal();
    }

    export function close() {
        modal.close();
    }

    function searchResults() {
        results = [];
        if (query != "") {
            dataWorker.postMessage({ type: "search", category: searchType, query });
        }
    }

    dataWorker.addEventListener("message", function(e: MessageEvent<ResponseMessage>) {
        if (e.data.type === "offices" || e.data.type === "positions") {
            results = e.data.results.map(r => ({ type: e.data.type, ...r })) as SearchResult[];
        }
    });

    /**
     * Traverses the tree until the node with the provided name is found
     */
    function getNode(node: HierarchyNode, name: string): HierarchyNode | undefined {
        if (node.data.name === name) {
            return node;
        }

        for (const child of node.children ?? []) {
            const resultNode: HierarchyNode | undefined = getNode(child, name);
            if (resultNode !== undefined) {
                return resultNode;
            }
        }
    }

    function resultClicked(result: SearchResult) {
        close(); 

        console.log(getNode(tree.root, "Extensions"));

        switch (result.type) {
            case "offices":
                centerViewOnNode(getNode(tree.root, result.name));
                break;

            case "positions":
                centerViewOnNode(getNode(tree.root, result.office));
                break;
        }
    }

    function resultKeyPress(e: KeyboardEvent, result: SearchResult) {
        if (e.key === " ") {
            resultClicked(result);
        }
    }
</script>    

<dialog bind:this={modal}>
    <h2>Find</h2>
    <div class="search">
        <input 
            type="search"
            placeholder={searchType === "positions" ? "Title of Position": "Office Name"}
            bind:this={searchRef}
            bind:value={query} 
            oninput={searchResults} 
        />
        <div class="tab-bar">
            <button 
                class={searchType === "positions" ? "active" : ""}
                onclick={() => { searchType = "positions"; searchResults(); searchRef.focus(); }}
            >
                <img src={employeeUrl} alt="Employee">
                Positions
            </button>
            <button
                class={searchType === "offices" ? "active" : ""}
                onclick={() => { searchType = "offices"; searchResults(); searchRef.focus(); }}
            >
                <img src={officeUrl} alt="Office Building">
                Offices
            </button>
        </div>
    </div>
    <ul>
    {#each results as result}
        <li>
            <div 
                role="button"
                tabindex="0"
                class="result"
                onkeydown={(e) => resultKeyPress(e, result)}
                onclick={() => resultClicked(result)}
            >
            {#if result.type === "positions"}
                <img 
                    class="icon"
                    src={employeeUrl}
                    alt="Employee"
                    width="25px"
                    height="25px"
                />
                <p class="title">{result.title}</p>
                <p class="office">{result.office}</p>
                <p 
                    class="fte" 
                    title={result.grant ? "Position funded by the IDEA grant" : ""}
                >
                    {parseInt(result.fte.toString()) === result.fte ? result.fte.toFixed(1) : result.fte}<span class={result.grant ? "" : "no-asterisk"}>*</span>
                </p>
            {:else if searchType === "offices"}
                <img 
                    class="icon"
                    src={officeUrl}
                    alt="Office"
                    width="25px"
                    height="25px"
                />
                <p class="title">{result.name}</p>
                <p class="office">{result.parent ?? "—"}</p>
            {/if}
            </div>
        </li>
    {/each}
    </ul>
    <button onclick={close} class="modal-btn">Close</button>
</dialog>

<style>
    dialog {
        width: 90%;
    }

    input[type="search"] {
        width: 40ch;
    }

    ul {
        list-style-type: none;
        padding: 0;
        height: 18rem;
        overflow-y: auto;
        width: 100%;
    }

    ul li {
        width: 100%;
    }

    .icon {
        grid-area: icon;
        place-self: center;
    }

    .result {
        display: grid;
        grid-template-columns: 40px 1fr auto;
        grid-template-rows: 1fr 1fr;
        grid-template-areas: 
            "icon position fte"
            "icon office fte";
        cursor: pointer;
        padding: 0.25em 1em;
    }

    .title {
        grid-area: position;
    }

    .office {
        grid-area: office;
        color: gray;
        font-size: 0.875rem;
    }

    .fte {
        grid-area: fte;
        align-self: center;
        text-align: right;
    }

    .result p {
        margin: 0;
    }

    .result:hover {
        background-color: #eee;
    }

    .tab-bar img {
        width: 16px;
        height: 16px;
    }

    .tab-bar {
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        background-color: #eee;
        padding: 0.2em;
    }

    .tab-bar button {
        padding: 0.5em;
        border: none;
        background-color: transparent;
        border-radius: 8px;
        display: flex;
        gap: 4px;
    }

    .active {
        background-color: white !important;
        box-shadow: 0px 0px 5px #DDDDDD;
    }

    .search {
        display: flex;
        flex-direction: row;
        gap: 10px;
    }

    .no-asterisk {
        color: transparent;
    }
</style>