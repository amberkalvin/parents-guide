import { CapacitorHttp } from '@capacitor/core';
import * as cheerio from 'cheerio';

const getHeaders = () => ({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
});

async function nativeFetch(url, options = {}) {
    try {
        const reqOptions = {
            url,
            headers: { ...getHeaders(), ...options.headers },
            method: options.method || 'GET',
        };
        if (options.body) {
            reqOptions.data = typeof options.body === 'string' && options.headers && options.headers['Content-Type'] === 'application/json' 
                ? JSON.parse(options.body) 
                : options.body;
        }

        const response = await CapacitorHttp.request(reqOptions);
        return {
            ok: response.status >= 200 && response.status < 300,
            status: response.status,
            text: async () => typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
            json: async () => typeof response.data === 'string' ? JSON.parse(response.data) : response.data,
        };
    } catch (e) {
        console.error('Native fetch failed, falling back:', e);
        return fetch(url, options);
    }
}

export async function searchMovies(q) {
    if (!q) return { results: [] };

    const firstChar = q.charAt(0).toLowerCase();
    const targetUrl = `https://v2.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(q)}.json`;

    const response = await nativeFetch(targetUrl);

    if (!response.ok) {
        throw new Error(`IMDb API responded with ${response.status}`);
    }

    const data = await response.json();
    const results = (data.d || []).map((item) => ({
        id: item.id,
        title: item.l,
        year: item.y,
        image: item.i ? item.i.imageUrl : null,
        stars: item.s,
        type: item.q
    }));

    return { results };
}

export async function fetchGuide(id) {
    if (!id) throw new Error('Query parameter "id" is required');

    const query = `
    query {
        title(id: "${id}") {
            titleText {
                text
            }
            parentsGuide {
                categories {
                    category { text }
                    severity { text }
                }
                guideItems(first: 50) {
                    edges {
                        node {
                            text { plainText }
                            category { text }
                        }
                    }
                }
            }
        }
    }`;

    const response = await nativeFetch('https://api.graphql.imdb.com/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
    });

    if (!response.ok) {
        throw new Error(`IMDb responded with ${response.status}`);
    }

    const json = await response.json();
    if (!json.data || !json.data.title || !json.data.title.parentsGuide) {
        throw new Error('Invalid data returned from IMDb GraphQL');
    }

    const titleData = json.data.title;
    const pageTitle = titleData.titleText ? titleData.titleText.text : id;
    
    const categoriesList = titleData.parentsGuide.categories || [];
    const guideItemsEdges = (titleData.parentsGuide.guideItems && titleData.parentsGuide.guideItems.edges) || [];

    const guideData = [];

    // Map severities
    const categorySeverities = {};
    categoriesList.forEach(c => {
        if (c.category && c.category.text && c.severity && c.severity.text) {
            categorySeverities[c.category.text] = c.severity.text;
        }
    });

    // Group items by category
    const categoryItems = {};
    guideItemsEdges.forEach(edge => {
        const node = edge.node;
        if (node.category && node.category.text && node.text && node.text.plainText) {
            const catName = node.category.text;
            if (!categoryItems[catName]) categoryItems[catName] = [];
            categoryItems[catName].push(node.text.plainText);
        }
    });

    // Desired order of categories
    const targetCategories = ['Sex & Nudity', 'Violence & Gore', 'Profanity', 'Alcohol, Drugs & Smoking', 'Frightening & Intense Scenes'];

    targetCategories.forEach(cat => {
        if (categorySeverities[cat] || categoryItems[cat]) {
            guideData.push({
                name: cat,
                severity: categorySeverities[cat] || 'Unknown',
                items: categoryItems[cat] || []
            });
        }
    });

    return {
        id,
        title: pageTitle,
        guide: guideData
    };
}
