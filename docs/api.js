// api.js
const GameAPI = {
    config: {
        BASE_URL: 'https://api.rawg.io/api',
        API_KEY: '1dbdffd6a2c346d58d5315e24d5b2f47', // API key
        DEFAULT_PAGE_SIZE: 12
    },

    getLastYearDateRange() {
        const today = new Date();
        const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        return `${lastYear.toISOString().split('T')[0]},${today.toISOString().split('T')[0]}`;
    },

    calculateRating(game) {
        if (game.metacritic) {
            return (game.metacritic / 10).toFixed(1);
        } else if (game.rating && game.rating_count > 10) {
            return game.rating.toFixed(1);
        }
        return 'N/A';
    },

    getLastMonthDate() {
        const today = new Date();
        const lastMonth = new Date(today.setMonth(today.getMonth() - 1));
        return `${lastMonth.toISOString().split('T')[0]},${new Date().toISOString().split('T')[0]}`;
    },

    async getGames({ 
        page = 1,
        search = '',
        pageSize = 40,
        ordering = '-popularity_precise,-metacritic', 
        metacritic = '100',
        dates = this.getLastYearDateRange(),
        platforms = '4,5,6'
    } = {}) {
        try {
            const url = `${this.config.BASE_URL}/games?key=${this.config.API_KEY}&page=${page}&page_size=${pageSize}&ordering=${ordering}&metacritic=${metacritic}&dates=${dates}&platforms=${platforms}&search=${search}&exclude_content=nsfw,explicit&tags_exclude=nsfw,nudity,sexual-content,adult`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch games');
            
            const data = await response.json();
            
            return {
                results: data.results.map(game => ({
                    id: game.id,
                    title: game.name,
                    thumbnail: game.background_image,
                    genre: game.genres?.map(g => g.name).join(', ') || 'Unknown',
                    platform: game.platforms?.map(p => p.platform.name).join(', ') || 'Unknown',
                    release_date: game.released,
                    rating: this.calculateRating(game),
                    metacritic: game.metacritic,
                    rating_count: game.ratings_count,
                    reviews_count: game.reviews_text_count,
                    suggestions_count: game.suggestions_count,
                    esrb_rating: game.esrb_rating?.name || 'Not rated'
                })),
                count: data.count,
                next: data.next,
                previous: data.previous
            };
        } catch (error) {
            console.error('Error fetching games:', error);
            throw new Error('Error fetching games: ' + error.message);
        }
    },

    async getGameDetails(gameId) {
        try {
            const url = `${this.config.BASE_URL}/games/${gameId}?key=${this.config.API_KEY}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Failed to fetch game details');
            
            const game = await response.json();
            
            return {
                id: game.id,
                title: game.name,
                description: game.description_raw,
                thumbnail: game.background_image,
                screenshots: game.background_image_additional,
                website: game.website,
                metacritic: game.metacritic,
                metacritic_url: game.metacritic_url,
                released: game.released,
                tba: game.tba,
                rating: game.rating,
                rating_count: game.ratings_count,
                ratings: game.ratings,
                platforms: game.platforms?.map(p => ({
                    platform: p.platform.name,
                    released_at: p.released_at,
                    requirements: p.requirements
                })),
                stores: game.stores?.map(s => ({
                    store: s.store.name,
                    url: s.url
                })),
                developers: game.developers?.map(d => d.name),
                publishers: game.publishers?.map(p => p.name),
                genres: game.genres?.map(g => g.name),
                esrb_rating: game.esrb_rating?.name,
                tags: game.tags?.map(t => t.name)
            };
        } catch (error) {
            console.error('Error fetching game details:', error);
            throw new Error('Error fetching game details: ' + error.message);
        }
    }
};