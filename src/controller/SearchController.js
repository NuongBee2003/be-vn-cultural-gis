const { getClient, isEnabled } = require('../services/elasticsearchClient');

class SearchController {
    getPlaceLocationsIndex() {
        return process.env.ELASTICSEARCH_PLACE_LOCATIONS_INDEX || 'place_locations';
    }

    foldVietnameseText(value) {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/\s+/g, ' ')
            .trim();
    }

    async searchPlaceLocations({
        query,
        page = 1,
        limit = 20,
    }) {
        const text =
            typeof query === 'string'
                ? query.trim()
                : '';

        if (!text) {
            const err = new Error('query is required');

            err.statusCode = 400;
            err.code = 'VALIDATION_ERROR';
            err.expose = true;

            throw err;
        }

        if (!isEnabled()) {
            const err = new Error(
                'Elasticsearch is not enabled. Set ELASTICSEARCH_URL.'
            );

            err.statusCode = 503;
            err.code = 'ELASTICSEARCH_DISABLED';
            err.expose = true;

            throw err;
        }

        const client = getClient();

        if (!client) {
            const err = new Error(
                'Elasticsearch client is not available'
            );

            err.statusCode = 503;
            err.code = 'ELASTICSEARCH_UNAVAILABLE';
            err.expose = true;

            throw err;
        }

        const index = this.getPlaceLocationsIndex();

        const foldedText =
            this.foldVietnameseText(text);

        const from =
            Math.max(page - 1, 0) * limit;

        const fuzziness =
            foldedText.length <= 3
                ? 0
                : 'AUTO';

        const result = await client.search({
            index,

            from,
            size: limit,

            timeout: '2s',

            min_score: 1,

            _source: [
                'name',
                'address',
                'description',
                'thumbnail',
                'location',
            ],

            query: {
                bool: {
                    should: [
                        // Exact keyword match
                        {
                            term: {
                                'name.keyword': {
                                    value: text,
                                    boost: 100,
                                },
                            },
                        },

                        // Exact folded keyword match
                        {
                            term: {
                                'name_folded.keyword': {
                                    value: foldedText,
                                    boost: 90,
                                },
                            },
                        },

                        // Phrase match
                        {
                            match_phrase: {
                                name: {
                                    query: text,
                                    boost: 20,
                                },
                            },
                        },

                        // Phrase folded
                        {
                            match_phrase: {
                                name_folded: {
                                    query: foldedText,
                                    boost: 18,
                                },
                            },
                        },

                        // Main search
                        {
                            multi_match: {
                                query: text,

                                fields: [
                                    'name^8',
                                    'address^3',
                                ],

                                fuzziness,
                                prefix_length: 1,

                                minimum_should_match:
                                    '70%',
                            },
                        },

                        // Folded search
                        {
                            multi_match: {
                                query: foldedText,

                                fields: [
                                    'name_folded^10',
                                    'address_folded^4',
                                ],

                                fuzziness,
                                prefix_length: 1,

                                minimum_should_match:
                                    '70%',
                            },
                        },

                        // Description search
                        {
                            match: {
                                description: {
                                    query: text,
                                    boost: 0.2,
                                },
                            },
                        },

                        // Folded description
                        {
                            match: {
                                description_folded: {
                                    query: foldedText,
                                    boost: 0.2,
                                },
                            },
                        },
                    ],

                    minimum_should_match: 1,
                },
            },
        });

        const hits =
            result?.hits?.hits || [];

        const maxScore =
            hits[0]?._score || 0;

        // Dynamic score filter
        const filteredHits = hits.filter((h) => {
            const score = h?._score || 0;

            // Keep top result always
            if (score === maxScore) {
                return true;
            }

            // Remove weak noisy results
            return score >= maxScore * 0.1;
        });

        return {
            page,
            limit,

            total:
                typeof result?.hits?.total ===
                'number'
                    ? result.hits.total
                    : result?.hits?.total?.value || 0,

            items: filteredHits.map((hit) => ({
                id: hit?._id,
                score: hit?._score,

                ...((hit && hit._source) || {}),
            })),
        };
    }
}

module.exports = new SearchController();