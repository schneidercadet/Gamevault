let popularGames = [];
let trendingGames = [];


// UI Functions
function showLoading() {
    document.getElementById('loadingOverlay').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; 
}

function hideLoading() {
    document.getElementById('loadingOverlay').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; 
}

window.addEventListener('scroll', () => {
    const nav = document.querySelector('.nav');
    if (window.scrollY > 0) {
        nav.classList.add('nav--scrolled');
    } else {
        nav.classList.remove('nav--scrolled');
    }
});

async function renderGamesRow(games, containerId) {
    const container = document.getElementById(containerId);
    if (!Array.isArray(games) || games.length === 0) {
        container.innerHTML = '<div class="no-results">No games found.</div>';
        return;
    }

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    games.forEach(game => {
        const gameDiv = document.createElement('div');
        gameDiv.className = 'game';
        gameDiv.innerHTML = createGameCard(game);
        gameDiv.onclick = () => showGameDetails(game.id);
        fragment.appendChild(gameDiv);
    });

    container.appendChild(fragment);
}

function createGameCard(game) {
    const defaultThumbnail = 'https://placehold.co/600x400?text=No+Image';
    
    const platformNames = game.platform?.split(', ') || [];
    const uniquePlatforms = [...new Set(platformNames.map(p => {
        if (p.toLowerCase().includes('playstation')) return 'playstation';
        if (p.toLowerCase().includes('xbox')) return 'xbox';
        if (p.toLowerCase().includes('pc')) return 'pc';
        if (p.toLowerCase().includes('nintendo')) return 'nintendo';
        return p.toLowerCase();
    }))];
    
    const platformIcons = uniquePlatforms.map(platform => {
        switch(platform) {
            case 'pc': return '<i class="fa-brands fa-windows"></i>';
            case 'playstation': return '<i class="fa-brands fa-playstation"></i>';
            case 'xbox': return '<i class="fa-brands fa-xbox"></i>';
            case 'nintendo': return '<i class="fa-solid fa-gamepad"></i>';
            default: return '';
        }
    }).filter(icon => icon).join(' ');

    return `
        <figure class="game__card">
            <img src="${game.thumbnail || defaultThumbnail}" alt="${game.title}" loading="lazy" onerror="this.src='${defaultThumbnail}'" />
            <figcaption>
                <div class="platform__icon">
                    ${platformIcons}
                </div>
                <h3>${game.title}</h3>
                <p>${game.genre || 'Unknown'}</p>
                ${game.metacritic ? `<p class="metacritic">Metacritic: ${game.metacritic}</p>` : ''}
            </figcaption>
        </figure>
    `;
}

const searchForm = document.getElementById('searchForm');
async function handleSearch(e) {
    e.preventDefault();
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm) {
        window.location.href = `games.html?search=${encodeURIComponent(searchTerm)}`;
    }
}
searchForm.addEventListener('submit', handleSearch);

// Initialize homepage

async function initializeHomepage() {
    try {
        hideLoading();
        const popularResponse = await GameAPI.getGames({
            pageSize: 10,
            ordering: '-metacritic,-rating',
            dates: GameAPI.getLastYearDateRange(),
        });

        const trendingResponse = await GameAPI.getGames({
            pageSize: 10,
            ordering: '-popularity_precise,-added',
            dates: GameAPI.getLastMonthDate()
        });

        await Promise.all([
            renderGamesRow(popularResponse.results, 'popularGamesGrid'),
            renderGamesRow(trendingResponse.results, 'trendingGamesGrid')
        ]);

    } catch (error) {
        console.error('Error initializing homepage:', error);
        showError('Failed to load games. Please try again later.');
    } finally {
        hideLoading();
    }
}

window.addEventListener('scroll', () => {
    const nav = document.querySelector('.nav');
    if (window.scrollY > 50) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  });

function showError(message) {
    console.error(message);
}


document.addEventListener('DOMContentLoaded', initializeHomepage);