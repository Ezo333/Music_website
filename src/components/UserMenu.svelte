<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
  />
</svelte:head>

<script>
  export let username = "Хэрэглэгч"; 
  export let userAvatar = "/images/user.png";
  export let isMobile = false;
</script>

<style>
  @media (max-width: 768px) {
    .user-menu {
      padding: 5px 10px;
    }

    .navigation-buttons {
      display: none;
    }

    .play-section {
      display: none;
    }

    .user-section {
      gap: 5px;
    }

    .notification {
      width: 40px;
      height: 40px;
    }

    .user-avatar-wrapper {
      padding: 3px 8px;
    }

    .user-avatar {
      width: 25px;
      height: 25px;
    }
    .user-avatar-wrapper span {
      display: none;
    }
  }
  .user-menu {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #18181B;
    padding: 10px 20px;
    border-radius: 10px;
    width: 100%;
  }

  .navigation-buttons {
    display: flex;
    gap: 10px;
  }

  .nav-button {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s ease;
    color: #27272A;
  }

  .nav-button:hover {
    background-color: #3b3b3b;
  }

  .play-section {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(to right, black, rgb(72, 70, 70));
    border-radius: 20px;
    padding: 10px 20px;
    width: 100%;
    max-width: 400px;
    height: 20px;
    overflow: hidden;
  }

  .play-section img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    opacity: 0.5;
    border-radius: 20px;
  }

  .play-section-content {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 1;
    color: white; 
  }

  .play-icon {
    position: absolute;
    right: 5px;
    background-color: #6B7280;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    color: white;
    z-index: 2;
  }

  .user-section {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user-avatar-wrapper {
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2c2c2c;
    padding: 5px 10px;
    border-radius: 20px;
    gap: 10px;
  }

  .user-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    overflow: hidden;
  }

  .user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .dropdown-icon {
    border-radius: 50%;
    padding: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .notification {
    background-color: #27272A;
    width: 80px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
  }
</style>

<div class="user-menu">
  {#if !isMobile}
    <div class="navigation-buttons">
      <div class="nav-button">
        <i class="fas fa-chevron-left"></i>
      </div>
      <div class="nav-button">
        <i class="fas fa-chevron-right"></i>
      </div>
    </div>
  {/if}

  <div class="user-section">
    {#if !isMobile}
      <div class="play-section">
        <img src="/images/Mongol.png" alt="Song Thumbnail" />
        <div class="play-section-content">
          <span>Монгол улсын төрийн дуулал</span>
        </div>
        <div class="play-icon">
          <i class="fas fa-play"></i>
        </div>
      </div>
    {/if}
    
    <div class="notification">
      <i class="fas fa-bell"></i>
    </div>
    <div class="user-avatar-wrapper">
      <div class="user-avatar">
        <img src={userAvatar} alt="User Avatar" />
      </div>
      {#if !isMobile}
        <span>{username}</span>
      {/if}
      <div class="dropdown-icon">
        <i class="fas fa-caret-down"></i>
      </div>
    </div>
  </div>
</div>