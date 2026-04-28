export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: 'Query parameter "id" is required' });
    }

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

    try {
        const response = await fetch('https://api.graphql.imdb.com/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'IMDb GraphQL error' });
        }

        const json = await response.json();
        if (!json.data || !json.data.title || !json.data.title.parentsGuide) {
            return res.status(500).json({ error: 'Invalid data returned from IMDb GraphQL' });
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

        res.status(200).json({
            id,
            title: pageTitle,
            guide: guideData
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
