<script lang="ts">
  import SignIn from 'svelte-clerk/server-components/SignIn.svelte';
</script>

<div class="sign-in-container">
  <SignIn />
</div>

<style>
  .sign-in-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
    padding: 2rem;
  }
</style>

