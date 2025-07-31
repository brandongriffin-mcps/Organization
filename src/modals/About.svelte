<script lang="ts">
    let modal: HTMLDialogElement;
    
    export function show() {
        modal.showModal();
    }

    export function close() {
        modal.close();
    }
</script>    

<dialog bind:this={modal}>
    <img src="logo.png" width="200" height="120" alt="MCPS Logo">
    <div>
      <h2>Specialized Support Services Organization Chart</h2>
      <p>Developed by Brandon Griffin for Dr. Cage under the 2025 MCPS Summer Internship program.</p>
      <button onclick={close} class="modal-btn">Close</button>
    </div>
</dialog>

<style>
dialog {
  width: 38rem;
}

dialog[open] {
  display: grid;
  grid-template-columns: 200px 1fr;
  align-items: center;
}
</style>