const { getClient, isEnabled } = require('../services/elasticsearchClient');
const { Op, literal } = require('sequelize');
const db = require('../models');

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
            return score >= maxScore * 0.35;
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

    /**
     * Tìm kiếm location bằng DB (không cần Elasticsearch).
     * Hỗ trợ tiếng Việt: tìm có dấu lẫn không dấu.
     *
     * @param {object} params
     * @param {string} params.query  - Từ khóa tìm kiếm
     * @param {number} [params.page=1]
     * @param {number} [params.limit=20]
     */
    async searchPlaceLocationsByDB({
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

        const pageNum = Math.max(Number(page) || 1, 1);
        const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);
        const offset = (pageNum - 1) * limitNum;

        // Tạo pattern LIKE cho text gốc (có dấu)
        const likePattern = `%${text}%`;

        // Normalize không dấu để tìm kiếm kiểu "chua" → "Chùa"
        const foldedText = this.foldVietnameseText(text);

        // Dùng MySQL REGEXP_REPLACE hoặc collation để so sánh không dấu.
        // Với utf8mb4_unicode_ci, MySQL tự coi "chua" ≈ "chùa" ở một số trường hợp,
        // nhưng để chắc chắn ta dùng thêm literal SQL để so sánh không dấu.
        const foldedLike = `%${foldedText}%`;

        const wherePlace = {
            [Op.or]: [
                // Tìm theo tên gốc (có dấu)
                literal(
                    `LOWER(\`Place\`.\`name\`) LIKE ${db.sequelize.escape(likePattern.toLowerCase())}`
                ),
                // Tìm theo tên không dấu (MySQL built-in collation sẽ xử lý)
                literal(
                    `LOWER(CONVERT(\`Place\`.\`name\` USING utf8mb4)) COLLATE utf8mb4_unicode_ci LIKE ${db.sequelize.escape(foldedLike)}`
                ),
            ],
        };

        const whereLocation = {
            [Op.or]: [
                literal(
                    `LOWER(\`Location\`.\`address\`) LIKE ${db.sequelize.escape(likePattern.toLowerCase())}`
                ),
                literal(
                    `LOWER(CONVERT(\`Location\`.\`address\` USING utf8mb4)) COLLATE utf8mb4_unicode_ci LIKE ${db.sequelize.escape(foldedLike)}`
                ),
            ],
        };

        // Query: tìm Place có name khớp hoặc Location có address khớp
        const { count, rows } = await db.Place.findAndCountAll({
            where: wherePlace,
            attributes: ['id', 'name', 'description', 'category_id'],
            include: [
                {
                    model: db.Location,
                    as: 'locations',
                    attributes: ['id', 'lat', 'lng', 'address'],
                    required: false,
                },
                {
                    model: db.Asset,
                    as: 'assets',
                    attributes: ['id', 'url', 'is_primary'],
                    required: false,
                    where: {
                        post_id: null,
                        review_id: null,
                    },
                },
                {
                    model: db.Category,
                    as: 'category',
                    attributes: ['id', 'name', 'icon_marker', 'color'],
                    required: false,
                },
            ],
            limit: limitNum,
            offset,
            distinct: true,
            subQuery: false,
        });

        // Nếu không tìm thấy theo tên Place, thử tìm thêm theo địa chỉ Location
        let extraFromAddress = [];
        const foundIds = new Set(rows.map((r) => r.id));

        const locationMatches = await db.Location.findAll({
            where: whereLocation,
            attributes: ['place_id'],
            raw: true,
        });

        const extraPlaceIds = [
            ...new Set(
                locationMatches
                    .map((l) => l.place_id)
                    .filter((pid) => !foundIds.has(pid))
            ),
        ];

        if (extraPlaceIds.length > 0) {
            extraFromAddress = await db.Place.findAll({
                where: { id: { [Op.in]: extraPlaceIds } },
                attributes: ['id', 'name', 'description', 'category_id'],
                include: [
                    {
                        model: db.Location,
                        as: 'locations',
                        attributes: ['id', 'lat', 'lng', 'address'],
                        required: false,
                    },
                    {
                        model: db.Asset,
                        as: 'assets',
                        attributes: ['id', 'url', 'is_primary'],
                        required: false,
                        where: {
                            post_id: null,
                            review_id: null,
                        },
                    },
                    {
                        model: db.Category,
                        as: 'category',
                        attributes: ['id', 'name', 'icon_marker', 'color'],
                        required: false,
                    },
                ],
            });
        }

        const allRows = [...rows, ...extraFromAddress];
        const total = count + extraPlaceIds.length;

        const items = allRows.map((place) => {
            const placeJson = place.toJSON();
            const primaryAsset =
                (placeJson.assets || []).find((a) => a.is_primary) ||
                (placeJson.assets || [])[0] ||
                null;

            return {
                place_id: placeJson.id,
                name: placeJson.name,
                description: placeJson.description,
                category: placeJson.category || null,
                thumbnail: primaryAsset ? primaryAsset.url : null,
                locations: (placeJson.locations || []).map((loc) => ({
                    location_id: loc.id,
                    lat: loc.lat ? Number(loc.lat) : null,
                    lng: loc.lng ? Number(loc.lng) : null,
                    address: loc.address,
                })),
            };
        });

        return {
            page: pageNum,
            limit: limitNum,
            total,
            items,
        };
    }
}

module.exports = new SearchController();