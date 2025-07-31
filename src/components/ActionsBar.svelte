<script lang="ts">
    import ModeActions from "./ModeActions.svelte";
    import UndoRedoActions from "./UndoRedoActions.svelte";
    import ZoomActions from "./ZoomActions.svelte";
</script>

<div class="actions-bar">
    <ZoomActions />
    <UndoRedoActions />
    <ModeActions />
</div>

<style>
.actions-bar {
    display: flex; 
    gap: 20px;
    position: absolute;
    bottom: 20px;
    left: 20px;
}
</style>