<script>
  let userLists = ['Муугүй лист', 'Гоё дуунууд'];
  let activeMenuItem = ''; 
  let imageMap = {
    'Муугүй лист': ['./images/list1.jpg'],
    'Гоё дуунууд': ['./images/list2.jpg'],
  };
</script>

<style>
  .sidebar {
    width: 150px;
    background-color: #27272A;
    color: white;
    height: 1000;
    display: flex;
    flex-direction: column;
    padding: 20px;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
  }

  .logo {
    margin-bottom: 30px;
    display: flex;
    align-items: center;
    font-size: 1.5rem;
    font-weight: bold;
    color: #A1A1AA; 
    transition: color 0.2s, border-right 0.2s;
  }

  .logo img {
    height: 30px;
    margin-right: 10px;
  }

  .menu {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 30px;
  }

  .bottom {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .menu-item,
  .bottom-item,
  .user-list {
    display: flex;
    align-items: center;
    font-size: 1rem;
    cursor: pointer;
    gap: 10px;
    transition: color 0.2s, border-right 0.2s;
    color: #A1A1AA; 
  }

  .menu-item:hover,
  .bottom-item:hover,
  .user-list:hover,
  .logo:hover {
    color: #FAFAFA; 
  }

  .menu-item.active,
  .bottom-item.active,
  .user-list.active {
    color: #FAFAFA; 
    border-right: 3px solid #FAFAFA; 
  }

  .icon {
    width: 20px; 
    height: 20px; 
    margin-right: 5px; 
  }
  .user-list {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .user-list img {
    object-fit: cover;
    border-radius: 5px;
  }
  .text{
    color: #525252;
  }

  .line {
    width: 150px;
    height: 1px;
    background-color: #52525B;
  }
</style>

<div class="sidebar">
  <!-- Logo -->
  <div class="logo">
    <img src="./images/logo.png" alt="Logo" />
  </div>

  <!-- Main Menu -->
  <div class="menu">
    <div class="menu-item" class:active={activeMenuItem === 'home'} on:click={() => (activeMenuItem = 'home')}>
      <i class="fas fa-home icon"></i>
      <span>Нүүр</span>
    </div>
    <div class="menu-item" class:active={activeMenuItem === 'search'} on:click={() => (activeMenuItem = 'search')}>
      <i class="fas fa-search icon"></i>
      <span>Хайх</span>
    </div>
  </div>

  <!-- Bottom Menu -->
  <div class="bottom">
    
    <div class="text">
      <span>Миний сан</span>
    </div>
    
    <div class="bottom-item" class:active={activeMenuItem === 'recent'} on:click={() => (activeMenuItem = 'recent')}>
      <i class="fas fa-music icon"></i>
      <span>Сүүлд сонссон</span>
    </div>
    <div class="bottom-item" class:active={activeMenuItem === 'favorites'} on:click={() => (activeMenuItem = 'favorites')}>
      <i class="fas fa-heart icon"></i>
      <span>Дуртай</span>
    </div>
    <div class="bottom-item" class:active={activeMenuItem === 'createMix'} on:click={() => (activeMenuItem = 'createMix')}>
      <i class="fas fa-plus icon"></i>
      <span>Микс үүсгэх</span>
    </div>
    <div class="line"></div>

    <!-- User-created lists -->
  {#each userLists as list, i}
  <div 
    class="user-list" 
    class:active={activeMenuItem === `userList${i}`} 
    tabindex="0"
    role="button"
    on:click={() => (activeMenuItem = `userList${i}`)} 
    on:keydown={(e) => e.key === 'Enter' && (activeMenuItem = `userList${i}`)}
  >
    <!-- Display images dynamically from the map -->
    {#if imageMap[list]}
      {#each imageMap[list] as image}
        <img src={image} alt="{list} image" class="icon" />
      {/each}
    {/if}
    <span>{list}</span>
  </div>
  {/each}

  </div>
</div>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
  />
</svelte:head>

