<script lang="ts">
  import SignUp from 'svelte-clerk/server-components/SignUp.svelte';
</script>

<div class="sign-up-container">
  <SignUp />
</div>

<style>
  .sign-up-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
    padding: 2rem;
  }
</style>

