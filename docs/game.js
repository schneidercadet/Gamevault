const gamesGrid = document.getElementById('gamesGrid');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const loadingBar = document.getElementById('loadingBar');
const platformFilter = document.getElementById('platformFilter');
const genreFilter = document.getElementById('genreFilter');
const yearFilter = document.getElementById('yearFilter');

let games = [];
let currentPage = 1;
const gamesPerPage = 40;

const platforms = [
    { id: 4, name: 'PC' },
    { id: 187, name: 'PlayStation 5' },
    { id: 1, name: 'Xbox One' },
    { id: 7, name: 'Nintendo Switch' },
    { id: 18, name: 'PlayStation 4' },
    { id: 186, name: 'Xbox Series S/X' }
];

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

// Filters
function initializeFilters() {
    platformFilter.innerHTML = `
        <option value="">All Platforms</option>
        ${platforms.map(platform => 
            `<option value="${platform.id}">${platform.name}</option>`
        ).join('')}
    `;

    // Year Filter
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 20}, (_, i) => currentYear - i);
    yearFilter.innerHTML = `
        <option value="">All Years</option>
        ${years.map(year => 
            `<option value="${year}">${year}</option>`
        ).join('')}
    `;

    updateGenreFilter();
}

async function updateGenreFilter() {
    try {
        const response = await fetch(`${GameAPI.config.BASE_URL}/genres?key=${GameAPI.config.API_KEY}`);
        const data = await response.json();
        
        genreFilter.innerHTML = `
            <option value="">All Genres</option>
            ${data.results.map(genre => 
                `<option value="${genre.id}">${genre.name}</option>`
            ).join('')}
        `;
    } catch (error) {
        console.error('Error loading genres:', error);
    }
}

// Filter Handler
async function handleFilters() {
    showLoading();
    
    try {
        const platformValue = platformFilter.value;
        const genreValue = genreFilter.value;
        const yearValue = yearFilter.value;
        
        let queryParams = {
            pageSize: gamesPerPage,
            ordering: '-metacritic'
        };

        if (platformValue) {
            queryParams.platforms = platformValue;
        }

        if (genreValue) {
            queryParams.genres = genreValue;
        }

        if (yearValue) {
            const startDate = `${yearValue}-01-01`;
            const endDate = `${yearValue}-12-31`;
            queryParams.dates = `${startDate},${endDate}`;
        }

        const { results } = await GameAPI.getGames(queryParams);
        await renderGames(results);
    } catch (error) {
        showError('Failed to filter games. Please try again.');
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function renderGames(gamesToRender) {
    if (!Array.isArray(gamesToRender) || gamesToRender.length === 0) {
        gamesGrid.innerHTML = '<div class="no-results">No games found matching your criteria.</div>';
        return;
    }

    gamesGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    gamesToRender.forEach(game => {
        const gameDiv = document.createElement('div');
        gameDiv.className = 'game';
        gameDiv.innerHTML = createGameCard(game);
        fragment.appendChild(gameDiv);
    });

    gamesGrid.appendChild(fragment);
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
            case 'pc':
                return '<i class="fa-brands fa-windows"></i>';
            case 'playstation':
                return '<i class="fa-brands fa-playstation"></i>';
            case 'xbox':
                return '<i class="fa-brands fa-xbox"></i>';
            case 'nintendo':
                return '<i class="fa-solid fa-gamepad"></i>';
            default:
                return '';
        }
    }).filter(icon => icon).join(' ');

    return `
        <figure class="game__card" onclick="showGameDetails(${game.id})" style="cursor: pointer">
            <img src="${game.thumbnail || defaultThumbnail}" alt="${game.title}" loading="lazy" onerror="this.src='${defaultThumbnail}'" />
            <figcaption>
                <div class="platform__icon">
                    ${platformIcons}
                </div>
                <h2>${game.title}</h2>
                <p>Genre: <span>${game.genre || 'Unknown'}</span></p>
                <p>Release Date: <span>${game.release_date ? new Date(game.release_date).toLocaleDateString() : 'TBA'}</span></p>
                ${game.metacritic ? `<p>Metacritic: <span>${game.metacritic}</span></p>` : ''}
                <p>Rating: <span>${game.rating || 'N/A'}</span></p>
                ${game.esrb_rating ? `<p>ESRB: <span>${game.esrb_rating}</span></p>` : ''}
            </figcaption>
        </figure>
    `;
}

async function showGameDetails(gameId) {
    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.innerHTML = `
        <div class="game-modal__content">
            <button class="game-modal__close" onclick="this.closest('.game-modal').remove()">&times;</button>
            <div class="game-modal__loading">
                <h3>Loading game details</h3>
                <div class="progress-bar">
                    <div class="progress-bar__fill"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const progressBar = modal.querySelector('.progress-bar__fill');
    let progress = 0;

    const progressInterval = setInterval(() => {
        if (progress < 90) {  
            progress += Math.random() * 30; 
            progress = Math.min(progress, 90);
            progressBar.style.width = `${progress}%`;
        }
    }, 500);

    try {
        const gameDetails = await GameAPI.getGameDetails(gameId);
        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        setTimeout(() => {
            const modalContent = modal.querySelector('.game-modal__content');
            modalContent.innerHTML = `
                <button class="game-modal__close" onclick="this.closest('.game-modal').remove()">&times;</button>
                <h2>${gameDetails.title}</h2>
                <img src="${gameDetails.thumbnail}" alt="${gameDetails.title}" class="game-modal__image">
                <div class="game-modal__info">
                    <p>${gameDetails.description}</p>
                    <div class="game-modal__details">
                        <p><strong>Release Date:</strong> ${gameDetails.released}</p>
                        <p><strong>Developers:</strong> ${gameDetails.developers?.join(', ') || 'N/A'}</p>
                        <p><strong>Publishers:</strong> ${gameDetails.publishers?.join(', ') || 'N/A'}</p>
                        <p><strong>Genres:</strong> ${gameDetails.genres?.join(', ') || 'N/A'}</p>
                        <p><strong>Platforms:</strong> ${gameDetails.platforms?.map(p => p.platform).join(', ') || 'N/A'}</p>
                        ${gameDetails.website ? `<p><strong>Website:</strong> <a href="${gameDetails.website}" target="_blank" rel="noopener noreferrer">Official Website</a></p>` : ''}
                    </div>
                </div>
            `;
        }, 500); 
    } catch (error) {
        clearInterval(progressInterval);
        const modalContent = modal.querySelector('.game-modal__content');
        modalContent.innerHTML = `
            <button class="game-modal__close" onclick="this.closest('.game-modal').remove()">&times;</button>
            <div class="game-modal__error">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>Failed to load game details. Please try again.</p>
            </div>
        `;
        console.error('Error loading game details:', error);
    }
}

// Event Handlers
async function handleSearch(event) {
    event.preventDefault();
    showLoading();
    
    try {
        const searchTerm = searchInput.value;
        const { results } = await GameAPI.getGames({ search: searchTerm });
        await renderGames(results);
    } catch (error) {
        showError('Failed to search games. Please try again.');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Pagination

function createPagination(currentPage, totalPages) {
    const maxVisiblePages = 5; 
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    let paginationHtml = `
        <div class="pagination">
            <button class="pagination__btn" 
                    onclick="changePage(${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}>
                Previous
            </button>
    `;

    // First page
    if (startPage > 1) {
        paginationHtml += `
            <button class="pagination__btn" onclick="changePage(1)">1</button>
            ${startPage > 2 ? '<span class="pagination__dots">...</span>' : ''}
        `;
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <button class="pagination__btn ${i === currentPage ? 'pagination__btn--active' : ''}" 
                    onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }

    // Last page
    if (endPage < totalPages) {
        paginationHtml += `
            ${endPage < totalPages - 1 ? '<span class="pagination__dots">...</span>' : ''}
            <button class="pagination__btn" onclick="changePage(${totalPages})">${totalPages}</button>
        `;
    }

    paginationHtml += `
        <button class="pagination__btn" 
                onclick="changePage(${currentPage + 1})"
                ${currentPage === totalPages ? 'disabled' : ''}>
            Next
        </button>
    </div>`;

    return paginationHtml;
}

async function changePage(page) {
    try {
        if (page < 1) return;
        
        showLoading();
        const response = await GameAPI.getGames({ page });

        if (!response.results || response.results.length === 0) {
            showError('No more games available.');
            return;
        }

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        await renderGames(response.results);
        
        const totalPages = Math.min(Math.ceil(response.count / GameAPI.config.DEFAULT_PAGE_SIZE), 100);
        
        const paginationContainer = document.getElementById('pagination');
        paginationContainer.innerHTML = createPagination(page, totalPages);
    } catch (error) {
        console.error('Error changing page:', error);
        showError('Failed to load page. Please try again.');
    } finally {
        hideLoading();
    }
}


async function initializeApp() {
    try {
        showLoading();
        initializeFilters();
        
        const response = await GameAPI.getGames({
            pageSize: GameAPI.config.DEFAULT_PAGE_SIZE,
            ordering: '-relevance,-metacritic'
        });

        await renderGames(response.results);
        
        const totalPages = Math.min(Math.ceil(response.count / GameAPI.config.DEFAULT_PAGE_SIZE), 100);
        const paginationContainer = document.getElementById('pagination');
        paginationContainer.innerHTML = createPagination(1, totalPages);
    } catch (error) {
        showError('Failed to load games. Please try again later.');
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Event Listeners
searchForm.addEventListener('submit', handleSearch);
platformFilter.addEventListener('change', handleFilters);
genreFilter.addEventListener('change', handleFilters);
yearFilter.addEventListener('change', handleFilters);
document.addEventListener('DOMContentLoaded', initializeApp);