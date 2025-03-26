<script>
  import MusicPlayer from './MusicPlayer.svelte';
  import { currentMusic } from '../stores.js';

  let artists = [
    { name: 'Artist 1', image: './images/artist1.jpg' },
    { name: 'Artist 2', image: '/images/artist2.jpg' },
    { name: 'Artist 3', image: '/images/artist3.jpg' },
    { name: 'Artist 4', image: '/images/artist4.jpg' },
    { name: 'Artist 5', image: '/images/artist5.jpg' }
  ];
  let artist2 = [
    { name: 'Artist 6', image: './images/artist6.jpg' },
    { name: 'Artist 7', image: '/images/artist7.jpg' },
    { name: 'Artist 8', image: '/images/artist8.jpg' },
    { name: 'Artist 9', image: '/images/artist9.jpg' },
    { name: 'Artist 10', image: '/images/artist10.jpg' }
  ];
  let artist3= [
    { name: 'Artist 6', image: './images/artist6.jpg' },
    { name: 'Artist 7', image: '/images/artist7.jpg' },
    { name: 'Artist 8', image: '/images/artist8.jpg' },
    { name: 'Artist 9', image: '/images/artist9.jpg' }
  ];
  let artist4= [
    { name: 'Artist 5', image: '/images/artist5.jpg' },
    { name: 'Artist 6', image: './images/artist6.jpg' },
    { name: 'Artist 7', image: '/images/artist7.jpg' },
    { name: 'Artist 8', image: '/images/artist8.jpg' },
    { name: 'Artist 9', image: '/images/artist9.jpg' },
    { name: 'Artist 10', image: '/images/artist10.jpg' }
  ];

  let selectedArtist = null;

  function selectArtist(artist) {
    $currentMusic = {
      ame: artist.name,
      image: artist.image,
      artist: artist.name,
      isPlaying: true,
      liked: false 
    };
  }
  
</script>
<div class="scrollable-section">
<div class="music-section">
  <!-- Feature Image Section -->
  <div class="Feature">
    <img class="Feature-img" src="/images/Feature.jpg" alt="Feature" />
  </div>

  <!-- Hot Hits Section -->
  <div class="section-header">
    <div class="hot-title">New Hot</div>
  </div>

  <div class="line"></div>

  <!-- Artists Grid -->
  <div class="artist-grid">
    {#each artists as artist}
      <div class="artist-card" on:click={() => selectArtist(artist)}>
        <img
          src={artist.image}
          alt={artist.name}
          class="artist-image"
        />
        <div class="artist-name">{artist.name}</div>
      </div>
    {/each}
  </div>

  <!-- Шинээр нэмэгдсэн бүтээлүүд Section -->
  <div class="section-header">
    <div class="title-container">
      <div class="hot-title">Шинээр нэмэгдсэн бүтээлүүд</div>
      <a href="#" class="view-all">Бүгд үзэх</a>
    </div>
    <div class="additional-text">Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд</div>
  </div>
  <div class="line"></div>
  <!-- Artists 2 Grid -->
  <div class="artist-grid">
    {#each artist2 as artist2}
      <div class="artist-card">
        <img
          src={artist2.image}
          alt={artist2.name} 
          class="artist-image"
        />
        <div class="artist-name">{artist2.name}</div>
      </div>
    {/each}
  </div>
  <!-- Шинэ уран бүтээлч Section -->
  <div class="section-header">
    <div class="title-container">
      <div class="hot-title">Шинэ уран бүтээлч</div>
      <a href="#" class="view-all">Бүгд үзэх</a>
    </div>
    <div class="additional-text">Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд</div>
  </div>
  <div class="line"></div>
  <!-- Artists 3 Grid -->
  <div class="artist-grid">
    {#each artist2 as artist2}
      <div class="artist-card">
        <img
          src={artist2.image}
          alt={artist2.name} 
          class="artist-image3"
        />
        <div class="artist-name">{artist2.name}</div>
      </div>  
    {/each}
  </div>
  <!-- Шинээр нэмэгдсэн хамтрал уран бүтээлчид Section -->
  <div class="section-header">
    <div class="title-container">
      <div class="hot-title">Шинээр нэмэгдсэн хамтрал уран бүтээлчид</div>
      <a href="#" class="view-all">Бүгд үзэх</a>
    </div>
    <div class="additional-text">Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд</div>
  </div>
  <div class="line"></div>
  <!-- Artists 4 Grid -->
  <div class="artist-grid">
    {#each artist3 as artist3}
      <div class="artist-card">
        <img
          src={artist3.image}
          alt={artist3.name} 
          class="artist-image4"
        />
        <div class="artist-name">{artist3.name}</div>
      </div>  
    {/each}
  </div>
  <!-- Санал болгох Section -->
  <div class="section-header">
    <div class="title-container">
      <div class="hot-title">Санал болгох</div>
      <a href="#" class="view-all">Бүгд үзэх</a>
    </div>
    <div class="additional-text">Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд</div>
  </div>
  <div class="line"></div>
  <!-- Artists 3x2 Grid -->
  <div class="artist-grid-3x2">
    {#each artist4 as artist4}
      <div class="artist-card-3x2">
        <img
          src={artist4.image}
          alt={artist4.name}
          class="artist-image-3x2"
        />
        <div class="artist-text-area-3x2">
          <div class="artist-name">{artist4.name}</div>
        </div>
      </div>
    {/each}
  </div>
  <!-- Mood mix Section -->
  <div class="section-header">
    <div class="title-container">
      <div class="hot-title">Mood mix</div>
      <a href="#" class="view-all">Бүгд үзэх</a>
    </div>
    <div class="additional-text">Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд</div>
  </div>
  <div class="line"></div>
  <!-- Artists 6 Grid -->
  <div class="artist-grid">
    {#each artist2 as artist2}
      <div class="artist-card">
        <img
          src={artist2.image}
          alt={artist2.name} 
          class="artist-image"
        />
        <div class="artist-name">{artist2.name}</div>
      </div>
    {/each}
  </div>
  <!-- Сонгосон жанр Section -->
  <div class="section-header">
    <div class="title-container">
      <div class="hot-title">Сонгосон жанр</div>
      <a href="#" class="view-all">Бүгд үзэх</a>
    </div>
    <div class="additional-text">Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд</div>
  </div>
  <div class="line"></div>
  <!-- Artists 3 Grid -->
  <div class="artist-grid">
    {#each artist2 as artist2}
      <div class="artist-card">
        <img
          src={artist2.image}
          alt={artist2.name} 
          class="artist-image3"
        />
        <div class="artist-name">{artist2.name}</div>
      </div>  
    {/each}
  </div>
  <!-- MMusic mix Section -->
  <div class="section-header">
    <div class="title-container">
      <div class="hot-title">MMusic mix</div>
      <a href="#" class="view-all">Бүгд үзэх</a>
    </div>
    <div class="additional-text">Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд</div>
  </div>
  <div class="line"></div>
  <!-- Artists 6 Grid -->
  <div class="artist-grid">
    {#each artist2 as artist2}
      <div class="artist-card">
        <img
          src={artist2.image}
          alt={artist2.name} 
          class="artist-image"
        />
        <div class="artist-name">{artist2.name}</div>
      </div>
    {/each}
  </div>
  <div class="line"></div>
  <!-- Artists 6 Grid -->
  <div class="artist-grid">
    {#each artist2 as artist2}
      <div class="artist-card">
        <img
          src={artist2.image}
          alt={artist2.name} 
          class="artist-image"
        />
        <div class="artist-name">{artist2.name}</div>
      </div>
    {/each}
  </div>
  <!-- Өөр дуу сонсож үзэх үү? Section -->
  <div class="section-header">
    <div class="title-container">
      <div class="hot-title">Өөр дуу сонсож үзэх үү?</div>
      <a href="#" class="view-all">Бүгд үзэх</a>
    </div>
    <div class="additional-text">Таны дагасан уран бүтээлчдээс тулгуурласан миксүүд</div>
  </div>
  <div class="line"></div>
  <!-- Artists 6 Grid -->
  <div class="artist-grid">
    {#each artist2 as artist2}
      <div class="artist-card">
        <img
          src={artist2.image}
          alt={artist2.name} 
          class="artist-image-bot"
        />
        <div class="artist-name">{artist2.name}</div>
      </div>
    {/each}
  </div>
  <!-- Artists 6 Grid -->
  <div class="artist-grid">
    {#each artist2 as artist2}
      <div class="artist-card">
        <img
          src={artist2.image}
          alt={artist2.name} 
          class="artist-image-bot"
        />
        <div class="artist-name">{artist2.name}</div>
      </div>
    {/each}
  </div>
</div>
</div>
<style>
  .scrollable-section {
  overflow-y: auto; 
  overflow-x: hidden; 
  margin: 0 auto; 
  width: 100%;
}

  .scrollable-section::-webkit-scrollbar {
    width: 5px;
  }

  .scrollable-section::-webkit-scrollbar-thumb {
    background-color: #52525B;
    border-radius: 4px;
  }

  .scrollable-section::-webkit-scrollbar-track {
    background-color: #27272A; 
  }

  .additional-text{
    color:#A1A1AA;
  }
  .line {
  width: 800px;
  height: 1px; 
  background-color: #52525B; 
  }
  .music-section {
    flex: 1;
    padding: 20px;
    background-color: #18181B;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;
  }

  .Feature {
    max-width: 800px;
    width: 100%;
  }

  .Feature-img {
    width: 100%;
    height: 150px;
    border-radius: 10px;
    object-fit: cover;
  }

  .section-header {
    width: 100%;
    max-width: 800px;
  }

  .title-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .view-all {
    color: #fff;
    text-decoration: none;
    font-size: 1rem;
  }

  .hot-title {
    font-size: 1.8rem;
    font-weight: bold;
    position: relative;
    display: inline-block;
    padding-bottom: 5px;
    margin-bottom: 10px;
    color: #fff;
    text-align: left;
  }
  

  .artist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 20px;
    width: 100%;
    max-width: 800px;
  }

  

  .artist-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .artist-image3 {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    object-fit: cover;
  }
  .artist-image4{
    width: 190px;
    height: 130px;
    border-radius: 10px;
    object-fit: cover;
  }
  .artist-image-bot{
    width: 150px;
    height: 200px;
    border-radius: 10px;
    object-fit: cover;
  }

  .artist-image {
    width: 150px;
    height: 150px;
    border-radius: 10px;
    object-fit: cover;
  }
  .artist-grid-3x2 {
    display: grid;
    grid-template-columns: repeat(3, 1fr); 
    gap: 20px;
    max-width: 1200px;
    width: 800px;
  }

  .artist-card-3x2 {
    display: flex;
    align-items: center;
    border-radius: 10px;
    overflow: hidden;
    background-color: #52525B; 
    height: 80px; 
  }

  .artist-image-3x2 {
    width: 30%;
    height: 100%;
    object-fit: cover;
  }

  .artist-text-area-3x2 {
    width: 80%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000000; 
  }

  .artist-name {  
    font-size: 1.2rem;
    color: #A1A1AA; 
  }

</style>