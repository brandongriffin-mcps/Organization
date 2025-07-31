<script lang="ts">
  import { redo, undo } from "../history";
  import { switchMode } from "../treeStore.svelte";
  import { centerViewOnNode, resetZoom, zoomIn, zoomOut } from "../zoom";

  interface Modal {
    show: () => void;
    close: () => void;
  }

  let newFileModal = $state<Modal | null>(null);
  let saveAsModal = $state<Modal | null>(null);
  let openModal = $state<Modal | null>(null);
  let aboutModal = $state<Modal | null>(null);
  let findModal = $state<Modal | null>(null);

  let popup: HTMLDialogElement;
  let currentMenu: string = $state("");

  function openMenu(e: MouseEvent) {
    const button = e.currentTarget as HTMLButtonElement;

    currentMenu = button.textContent ?? "";

    const rect = button.getBoundingClientRect();
    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.top + rect.height}px`;
  
    popup.show();
  }

  function onMouseOver(e: MouseEvent | FocusEvent) {
    if (popup.open) {
      (e.currentTarget as HTMLButtonElement).click();
    }
  }

  function openHelp() {
    if (window.open !== undefined) {
      window.open("userguide.html", "_blank");
    } else {
      // Fallback method for Safari
      const a = document.createElement('a');
      a.target = "_blank";
      a.href = "userguide.html";
      a.click();
      a.remove();
    }
  }

  function handleShortcuts(e: KeyboardEvent) {
    if (e.repeat) return;

    if (e.ctrlKey && e.altKey && e.key === 'n') {
      newFileModal?.show();
      return;
    }

    if (e.key === 'Home') {
      centerViewOnNode();
      return;
    }

    if (e.key === '?') {
      openHelp();
      return;
    }
    
    if ((e.ctrlKey || e.metaKey)){
      switch(e.key) {
      case '0':
        resetZoom();
        break;
      case '=':
        e.preventDefault();
        zoomIn();
        break;
      case '-':
        e.preventDefault();
        zoomOut();
        break;
      case 'f':
        e.preventDefault();
        findModal?.show();
        break;
      case 'o':
        e.preventDefault();
        openModal?.show();
        break;
      case 's':
        e.preventDefault();
        saveAsModal?.show();
        break;
      case 'y':
        redo();
        break;
      case 'z':
        undo();
        break;
      case ' ':
        switchMode();
        break;
      }
    }
  }
</script>

{#snippet key(shortcut: string)}
<span>
  {#each shortcut.split("+").map(k => k.trim()) as key, i}
    <span class="key">{key}</span>
    {#if i != shortcut.split("+").length - 1}
    {` + `}
    {/if}
  {/each}
</span>
{/snippet}

<svelte:window onkeydown={handleShortcuts} />
<div class="toolbar" onmouseleave={() => { if (popup.open) popup.close() }} role="toolbar" tabindex="0">
    <div class="toolbar-wrapper">
        <button 
          onmouseover={onMouseOver} 
          onfocus={onMouseOver} 
          onclick={openMenu}
        >
          File
        </button>
        <button 
          onmouseover={onMouseOver} 
          onfocus={onMouseOver} 
          onclick={openMenu}
        >
          Edit
        </button>
        <button 
          onmouseover={onMouseOver} 
          onfocus={onMouseOver} 
          onclick={openMenu}
        >
          View
        </button>
        <button 
          onmouseover={onMouseOver} 
          onfocus={onMouseOver} 
          onclick={openMenu}
        >
          Help
        </button>
        <dialog bind:this={popup} class="popup">
        {#if currentMenu === "File"}
          <button onclick={newFileModal?.show}>
            New
          </button>
          <button onclick={openModal?.show}>
            Open
            {@render key("Ctrl+O")}
          </button>
          <button onclick={saveAsModal?.show}>
            Save As...
            {@render key("Ctrl+S")}
          </button>
        {:else if currentMenu === "Edit"}
          <button onclick={() => { undo() }}>
            Undo
            {@render key("Ctrl+Z")}
          </button>
          <button onclick={() => { redo() }}>
            Redo
            {@render key("Ctrl+Y")}
          </button>
          <button onclick={findModal?.show}>
            Find
            {@render key("Ctrl+F")}
          </button>
          <button onclick={() => { switchMode() }}>
            Switch Mode
            {@render key("Ctrl+Space")}
          </button>
        {:else if currentMenu === "View"}
          <button 
            onclick={() => { centerViewOnNode() }}
          >
            Reset View
          {@render key("Home")}
          </button>
          <button
            onclick={() => { zoomIn(); }}
          >
            Zoom In
            {@render key("Ctrl+=")}
          </button>
          <button
            onclick={() => { zoomOut(); }}
          >
            Zoom Out
            {@render key("Ctrl+-")}
          </button>
          <button
            onclick={() => { resetZoom(); }}
          >
            Reset Zoom
            {@render key("Ctrl+0")}
          </button>
        {:else if currentMenu === "Help"}
          <button
            onclick={openHelp}
          >
            View Help
            {@render key("?")}
          </button>
          <button onclick={aboutModal?.show}>About Organization</button>
        {/if} 
        </dialog>
    </div>
</div>
<!-- Lazy load the modals since they're not needed right away -->
{#await import("../modals/NewFile.svelte") then NewFile}
  <NewFile.default bind:this={newFileModal} />
{/await}
{#await import("../modals/Find.svelte") then Find}
  <Find.default bind:this={findModal} />
{/await}
{#await import("../modals/SaveAs.svelte") then SaveAs}
  <SaveAs.default bind:this={saveAsModal} />
{/await}
{#await import("../modals/Open.svelte") then Open}
  <Open.default bind:this={openModal} />
{/await}
{#await import("../modals/About.svelte") then About}
  <About.default bind:this={aboutModal} />
{/await}

<style>
.toolbar {
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid gray;
}

.toolbar button {
  font-size: 0.8125rem;
  background-color: transparent;
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
}

.toolbar button:hover {
  background-color: #eee;
}

.toolbar-wrapper {
  display: flex;
}

.popup {
  font-size: 0.8125rem;
  flex-direction: column;
  border: 1px solid black;
  border-radius: 8px;
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
  background-color: #fff;
  margin: 0;
  padding: 0;
}

.popup button {
  display: flex;
  border-radius: 0px;
  width: 100%;
  user-select: none;
  cursor: pointer;
  margin: 0;
  padding: 8px 8px 8px 8px;
  justify-content: space-between;
}

.popup button:hover {
  background-color: #ddd;
}

.popup button > span {
  margin-left: 1em;
}

.popup span > .key {
  font-family: monospace;
  background-color: white;
  color: #616161;
  border: 1px solid #616161;
  padding: 0.2em;
  border-radius: 4px;
  box-shadow: 0px 1px black; 
  padding: 0em 0.4em;
}
</style>