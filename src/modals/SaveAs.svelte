<script lang="ts">
    import excelUrl from "@icons/excel.svg";
    import graphicsUrl from "@icons/graphics.svg";
    import pictureUrl from "@icons/picture.svg";
    import { downloadPNG, downloadSVG, downloadXLSX } from "../export";

    type FileType = "PNG" | "SVG" | "XLSX";

    let modal: HTMLDialogElement;
    let fileName = $state<string>("");
    let fileType = $state<FileType>("PNG");

    export function show() {
        modal.showModal();
    }

    export function close() {
        modal.close();
    }

    function saveAs() {
        switch (fileType) {
        case "SVG":
            downloadSVG(fileName);
            break;
        case "PNG":
            downloadPNG(fileName);
            break;
        case "XLSX":
            downloadXLSX(fileName);
            break;
        }
    }
</script>

{#snippet saveOption(extension: FileType, icon: string, title: string, description: string)}
    <div 
      role="radio" 
      aria-checked={fileType === extension}
      tabindex="0" 
      onclick={() => { fileType = extension }}
      onkeypress={(e) => { 
        if (e.key === ' ' || e.key === 'Enter') {
          fileType = extension;
        }
      }}
      class="row {fileType === extension ? "save-selected" : ""}"
    >
        <img src={icon} alt={title} />
        <div class="info">
            <h3>{title} <span class="tag">{extension}</span></h3>
            <p>{description}</p>
        </div>
    </div>
{/snippet}

<dialog class="save-modal" bind:this={modal}>
    <h2>Save As</h2>
    <form method="dialog" onsubmit={saveAs}>
        <div>
            <input type="text" placeholder="File Name" bind:value={fileName} required><span id="file-type">{` .${fileType.toLowerCase()}`}</span>
        </div>
        <div role="radiogroup">
            {@render saveOption(
                "PNG",
                pictureUrl,
                "Image",
                "Good for printing out or sharing the diagram."
            )}
            {@render saveOption(
                "SVG",
                graphicsUrl,
                "Vector Graphics",
                "Make adjustments to the diagram in a vector graphics editor."
            )}
            {@render saveOption(
                "XLSX",
                excelUrl,
                "Spreadsheet",
                "A backup of the data that can be opened again later."
            )}
        </div>
        <div class="field">
            <button class="modal-btn" type="submit">Save</button>
            <button class="modal-btn" type="button" onclick={close}>Cancel</button>
        </div>
    </form>
</dialog>

<style>
.save-modal {
  border-radius: 8px;
  box-shadow: 1px 1px;
  width: 500px;
  background-color: #fff;
  padding: 8px;
  text-align: center;
}

.save-selected {
  background-color: #eee;
}

.save-modal > form > div {
  margin-top: 0.5rem;
}

.save-modal p {
  color: #666;
}

.save-modal input {
  transition: outline 0.2s;
  outline: 2px solid rgb(128 128 128 / 0);
}

.save-modal input:focus-visible {
  outline: 2px solid rgb(128 128 128 / 1);
}

.field {
  flex-direction: row;
  margin-bottom: 10px;
}


.info h3 {
  margin: 0;
  padding: 0;
}

.info p {
  margin: 0;
  padding: 0;
  color: #666;
}

.info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.tag {
  background-color: black;
  color: white;
  padding: 0px 4px;
  border-radius: 8px;
  font-size: 10pt;
}

.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  text-align: left;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
}

.row img {
  width: 32px;
  height: 32px;
}

.row:hover {
  background-color: #eee;
}

.info h3, 
.info p {
  font-size: 0.875rem;
}

.info span {
  font-size: 0.75rem;
}
</style>