<script>
  import { currentMusic } from '../stores.js';

  let audio = null; 
  let currentTime = 0;
  let duration = 0;

  function togglePlay() {
    if ($currentMusic) {
      if ($currentMusic.isPlaying) {
        audio?.pause();
      } else {
        audio?.play();
      }
      $currentMusic.isPlaying = !$currentMusic.isPlaying;
    }
  }

  function toggleLike() {
    if ($currentMusic) {
      $currentMusic.liked = !$currentMusic.liked;
    }
  }

  function updateTime() {
    if (audio) {
      currentTime = audio.currentTime || 0;
      duration = audio.duration || 0;
    }
  }

  function skipToStart() {
    if (audio) {
      audio.currentTime = 0;
    }
  }

  function skipToEnd() {
    if (audio) {
      audio.currentTime = audio.duration;
    }
  }

  $: if ($currentMusic) {
    if (!audio) {
      audio = new Audio('/music/sample.mp3');
      audio.addEventListener('timeupdate', updateTime);

      audio.addEventListener('ended', () => {
        $currentMusic.isPlaying = false;
      });
    }
  }

  $: if (!$currentMusic && audio) {
    audio.pause();
    audio.currentTime = 0;
    audio = null;
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
</script>

{#if $currentMusic}
  <div class="music-player">
    <div class="left">
      <img src={$currentMusic.image} alt="Artist" class="thumbnail" />
      <div>
        <div class="name">{'Mmusic'}</div>
        <div class="artist">{'Таны сонсож буй дуу'}</div>
      </div>
      <button class="heart hide-mobile" on:click={toggleLike}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill={$currentMusic.liked ? "#DC2626" : "none"} stroke={$currentMusic.liked ? "#DC2626" : "#9CA3AF"} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      <button class="mix hide-mobile">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="15" x2="16" y2="15"></line>
          <line x1="8" y1="9" x2="16" y2="9"></line>
        </svg>
      </button>
    </div>
    <div class="center hide-mobile">
      <button class="control" on:click={skipToStart}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 19l-9-7 9-7v14zm11 0l-9-7 9-7v14z"/>
        </svg>
      </button>
      <button class="control play" on:click={togglePlay}>
        {#if $currentMusic.isPlaying}
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4" width="4" height="24"/>
            <rect x="22" y="4" width="4" height="24"/>
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5,3 27,16 5,29"/>
          </svg>
        {/if}
      </button>
      <button class="control" on:click={skipToEnd}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 19l9-7-9-7v14zm-11 0l9-7-9-7v14z"/>
        </svg>
      </button>
      {formatTime(currentTime)}
      <div class="progress-bar">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime || 0}
          step="0.1"
          on:input={(e) => (audio.currentTime = e.target.value)}
        />
      </div>  
      {formatTime(duration || 0)}
      <button class="control">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 1l4 4-4 4"/>
          <path d="M3 11V9a4 4 0 014-4h14"/>
          <path d="M7 23l-4-4 4-4"/>
          <path d="M21 13v2a4 4 0 01-4 4H3"/>
        </svg>
      </button>    
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20L20.2 3.8M21 16v5h-5M15 15l5.1 5.1M4 4l5 5"/></svg>
    </div>
    <div class="right hide-mobile">
      Д.үг
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4D4D8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
      <div class="volume">
        <input type="range" min="0" max="100" value="50" />
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4D4D8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/><path d="M8 17V5l12-2v12"/></svg>
    </div>

    <div class="mobile-controls">
      <button class="control play" on:click={togglePlay}>
        {#if $currentMusic.isPlaying}
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4" width="4" height="24"/>
            <rect x="22" y="4" width="4" height="24"/>
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5,3 27,16 5,29"/>
          </svg>
        {/if}
      </button>
      <button class="control" on:click={skipToEnd}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 19l9-7-9-7v14zm-11 0l9-7-9-7v14z"/>
        </svg>
      </button>
    </div>
  </div>
{/if}

<style>
  .music-player {
    position: fixed;
    bottom: 0;
    width: 100%;
    background: linear-gradient(to right, #0061FF 0%, #00235B 20%, #00235B 100%);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    border-top: 1px solid #4478CD;
    z-index: 1000;
  }
  .left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .thumbnail {
    width: 50px;
    height: 50px;
    border-radius: 8px;
  }
  .center {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .control {
    background: none;
    color: white;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
  }
  .play {
    transform: scale(1.2);
  }
  .right {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-right: 30px;
  }
  .volume input {
    width: 100px;
  }
  .heart,
  .mix {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
  }
  
  .progress-bar input[type="range"] {
    width: 500px;
    height: 6px;
    background-color: #E4E4E7;
    border-radius: 5px;
    outline: none;
    overflow: hidden;
    cursor: pointer;
  }
  .progress-bar input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #27272A;
    cursor: pointer;
    transition: background 0.3s ease;
  }
  .progress-bar input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #27272A;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  /* Mobile styles */
  .mobile-controls {
    display: none;
    margin-right: 30px;
  }

  @media (max-width: 768px) {
    .hide-mobile {
      display: none;
    }

    .music-player {
      padding: 10px;
    }

    .left {
      flex: 1;
    }

    .mobile-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .thumbnail {
      width: 40px;
      height: 40px;
    }

    .name {
      font-size: 14px;
    }

    .artist {
      font-size: 12px;
      opacity: 0.8;
    }
  }
</style>