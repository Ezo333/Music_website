<script>
	import Sidebar from './components/Sidebar.svelte';
	import MusicSection from './components/MusicSection.svelte';
	import UserMenu from './components/UserMenu.svelte';
	import MusicPlayer from './components/MusicPlayer.svelte';
	import { onMount } from 'svelte';
  
	let isMobile = false;
	let isSidebarOpen = false;
  
	onMount(() => {
	  const checkMobile = () => {
		isMobile = window.innerWidth <= 768;
	  };
	  checkMobile();
	  window.addEventListener('resize', checkMobile);
	  return () => window.removeEventListener('resize', checkMobile);
	});
  
	const toggleSidebar = () => {
	  isSidebarOpen = !isSidebarOpen;
	};
  </script>
  
  <style>
	:global(body) {
	  overflow-x: hidden;
	  background-color: #27272A;
	  margin: 0;
	  padding: 0;
	}
  
	.container {
	  display: flex;
	  height: 100vh;
	}
  
	.content {
	  flex: 1;
	  display: flex;
	  flex-direction: column;
	}
  
	.header {
	  height: 60px;
	  background-color: #18181B;
	  display: flex;
	  justify-content: flex-end;
	  align-items: center;
	  padding: 0 20px;
	}
  
	/* Mobile styles */
	.mobile-header {
	  display: flex;
	  justify-content: space-between;
	  align-items: center;
	  height: 60px;
	  background-color: #18181B;
	  padding: 0 15px;
	  position: fixed;
	  top: 0;
	  left: 0;
	  right: 0;
	  z-index: 1000;
	}
  
	.menu-button {
	  background: none;
	  border: none;
	  color: white;
	  font-size: 1.5rem;
	  cursor: pointer;
	  padding: 5px;
	}
  
	.mobile-logo {
	  height: 30px;
	}
  
	.mobile-container {
	  padding-top: 60px;
	  height: calc(100vh - 60px);
	  overflow-y: auto;
	}
  
	.sidebar-overlay {
	  position: fixed;
	  top: 0;
	  left: 0;
	  right: 0;
	  bottom: 0;
	  background-color: rgba(0, 0, 0, 0.5);
	  z-index: 998;
	  display: none;
	}
  
	.sidebar-overlay.open {
	  display: block;
	}
  
	:global(.sidebar) {
	  transition: transform 0.3s ease;
	}
  
	@media (max-width: 768px) {
	  :global(.sidebar) {
		position: fixed;
		top: 0;
		left: 0;
		height: 100vh;
		transform: translateX(-100%);
		z-index: 999;
	  }
  
	  :global(.sidebar.open) {
		transform: translateX(0);
	  }
  
	  .container {
		flex-direction: column;
	  }
  
	  .content {
		margin-bottom: 70px; 
	  }
	}
  </style>
  
  {#if isMobile}
  <!-- Mobile Layout -->
  <div class="mobile-header">
    <button class="menu-button" on:click={toggleSidebar}>
      <i class="fas fa-bars"></i>
    </button>
    <img src="./images/logo.png" alt="Logo" class="mobile-logo" />
    <div class="user-controls">
      <UserMenu {isMobile} />
    </div>
  </div>

  <!-- Sidebar with overlay -->
  <div class="sidebar-overlay" class:open={isSidebarOpen} on:click={() => (isSidebarOpen = false)}></div>
  <div class="sidebar" class:open={isSidebarOpen}>
    <Sidebar {isMobile} />
  </div>

  <div class="mobile-container">
    <MusicSection {isMobile} />
  </div>

  <MusicPlayer {isMobile} />
{:else}
  <!-- Desktop Layout -->
  <div class="container">
    <Sidebar {isMobile} />
    <div class="content">
      <div class="header">
        <UserMenu {isMobile} />
      </div>
      <MusicSection {isMobile} />
    </div>
    <MusicPlayer {isMobile} />
  </div>
{/if}
  
  <svelte:head>
	<link
	  rel="stylesheet"
	  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
	/>
  </svelte:head>