const locationController = require('../controller/LocationController');
const placeController = require('../controller/PlaceController');
const assetController = require('../controller/AssetController');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { sendSuccess } = require('../utils/apiResponse');
const redisClient = require('../config/redisClient');
const { buildGrid, calcPerCell, runInBatches } = require('../utils/geoHashGrid');
const db = require('../models');

class LocationManager {

    getLocationById = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new HttpError(400, 'id phải là một số nguyên dương');
        }
        const location = await locationController.getLocationById(id);
        if (!location) {
            throw new HttpError(404, 'Location not found');
        }
        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: location,
        });
    });

    getLocationsByGeo = asyncHandler(async (req, res) => {
        const input = req.body || {};
        const { bbox, limit: rawLimit } = input;

        if (!bbox) {
            throw new HttpError(400, 'bbox là bắt buộc. Định dạng: minLng,minLat,maxLng,maxLat');
        }

        // Parse bbox
        const parts = String(bbox).split(',').map((v) => Number(v.trim()));
        if (parts.length !== 4 || parts.some((v) => Number.isNaN(v))) {
            throw new HttpError(400, 'bbox phải có đúng 4 số: minLng,minLat,maxLng,maxLat');
        }
        const [minLng, minLat, maxLng, maxLat] = parts;
        
        if (minLng >= maxLng || minLat >= maxLat) {
            throw new HttpError(400, 'bbox không hợp lệ: minLng < maxLng và minLat < maxLat');
        }

        const totalLimit = (rawLimit && Number.isInteger(Number(rawLimit)) && Number(rawLimit) > 0)
            ? Number(rawLimit)
            : 50;

        const bounds = { minLng, minLat, maxLng, maxLat };

        // --- Chia lưới ô GeoHash ---
        const cells = buildGrid(bounds);
        const perCell = calcPerCell(totalLimit, cells.length);

        // --- Per-cell Redis cache ---
        let hitCount = 0;
        const cellDataMap = new Map(); // cellKey → Array<location>

        // 1. Lấy từ cache những ô đã có
        await Promise.all(
            cells.map(async (cell) => {
                try {
                    const cached = await redisClient.get(cell.cellKey);
                    if (cached) {
                        cellDataMap.set(cell.cellKey, JSON.parse(cached));
                        hitCount++;
                    }
                } catch (_) { /* bỏ qua lỗi Redis */ }
            })
        );

        // 2. Query DB song song cho các ô chưa cache
        const missedCells = cells.filter((c) => !cellDataMap.has(c.cellKey));

        if (missedCells.length > 0) {
            const freshResults = await locationController.getLocationsByGeoHashGrid(missedCells, perCell);

            // Gán kết quả về từng ô (1 location thuộc ô nào thì vào ô đó)
            // Dùng per-cell bucket để cache riêng
            const buckets = new Map();
            for (const cell of missedCells) {
                buckets.set(cell.cellKey, []);
            }
            for (const loc of freshResults) {
                // Tìm ô chứa location này
                const ownerCell = missedCells.find(
                    (c) =>
                        loc.lat >= c.minLat && loc.lat <= c.maxLat &&
                        loc.lng >= c.minLng && loc.lng <= c.maxLng
                );
                if (ownerCell) {
                    buckets.get(ownerCell.cellKey).push(loc);
                }
            }

            // Lưu cache từng ô + nạp vào cellDataMap
            await Promise.all(
                missedCells.map(async (cell) => {
                    const rows = buckets.get(cell.cellKey) || [];
                    cellDataMap.set(cell.cellKey, rows);
                    try {
                        // Cache 10 phút mỗi ô — reuse khi pan sang vùng lân cận
                        await redisClient.setEx(cell.cellKey, 600, JSON.stringify(rows));
                    } catch (_) { /* bỏ qua lỗi Redis */ }
                })
            );
        }

        // 3. Merge tất cả ô, dedup theo id, giới hạn tổng = totalLimit
        const seen = new Set();
        const locations = [];
        for (const cell of cells) {
            const rows = cellDataMap.get(cell.cellKey) || [];
            for (const row of rows) {
                const rowId = row.id ?? row.dataValues?.id;
                if (rowId !== undefined && !seen.has(rowId)) {
                    seen.add(rowId);
                    locations.push(row);
                    if (locations.length >= totalLimit) break;
                }
            }
            if (locations.length >= totalLimit) break;
        }

        const responseData = {
            statusCode: 200,
            message: 'OK',
            data: locations,
            meta: {
                count: locations.length,
                limit: totalLimit,
                bbox: input.bbox,
                grid: {
                    cells: cells.length,
                    perCell,
                    cacheHits: hitCount,
                    cacheMisses: missedCells.length,
                },
            },
        };

        return sendSuccess(res, responseData);
    });

    getLocationsByCategory = asyncHandler(async (req, res) => {
        const categoryId = Number(req.params.categoryId);
        if (!Number.isInteger(categoryId) || categoryId <= 0) {
            throw new HttpError(400, 'categoryId phải là một số nguyên dương');
        }

        const locations = await locationController.getLocationsByCategory(categoryId);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: locations,
            meta: {
                count: locations.length,
                category_id: categoryId,
            },
        });
    });

    getLocationsByCategoryPaginated = asyncHandler(async (req, res) => {
        const categoryId = Number(req.params.categoryId);
        if (!Number.isInteger(categoryId) || categoryId <= 0) {
            throw new HttpError(400, 'categoryId phải là một số nguyên dương');
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const result = await locationController.getLocationsByCategoryPaginated(categoryId, page, limit);
        const totalPages = Math.ceil(result.count / result.limit);

        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: result.rows,
            meta: {
                total: result.count,
                count: result.rows.length,
                page: result.page,
                limit: result.limit,
                totalPages,
                category_id: categoryId,
            },
        });
    });

    create = asyncHandler(async (req, res) => {
        const { name, description, category_id, place_id, lat, lng, address, images } = req.body;

        const result = await db.sequelize.transaction(async (t) => {
            const opts = { transaction: t };

            // 1. Xử lý Place: dùng place_id có sẵn hoặc tạo mới
            let placeId;
            if (place_id) {
                placeId = Number(place_id);
                if (!Number.isInteger(placeId) || placeId <= 0) {
                    throw new HttpError(400, 'place_id phải là một số nguyên dương');
                }
            } else {
                if (!name) throw new HttpError(400, 'name (tên địa điểm) là bắt buộc khi không truyền place_id');
                const newPlace = await placeController.createPlace({ name, description, category_id }, opts);
                placeId = newPlace.id;
            }

            // 2. Tạo Location
            const location = await locationController.createLocation({ lat, lng, address, place_id: placeId }, opts);

            // 3. Lưu Assets nếu có images
            await assetController.createAssets(images || [], { location_id: location.id }, opts);

            return location;
        });

        return sendSuccess(res, {
            statusCode: 201,
            message: 'Created',
            data: result,
        });
    });

    delete = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new HttpError(400, 'id phải là một số nguyên dương');
        }
        const location = await locationController.getLocationById(id);
        if (!location) {
            throw new HttpError(404, 'Location not found');
        }
        await locationController.deleteLocation(location);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Deleted',
            data: null,
        });
    });

    update = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new HttpError(400, 'id phải là một số nguyên dương');
        }

        const { name, description, category_id, lat, lng, address, images } = req.body;

        const location = await locationController.getLocationById(id);
        if (!location) {
            throw new HttpError(404, 'Location not found');
        }

        const result = await db.sequelize.transaction(async (t) => {
            const opts = { transaction: t };

            // 1. Cập nhật Place nếu có name/description/category_id
            if (name !== undefined || description !== undefined || category_id !== undefined) {
                await placeController.updatePlace(location.place_id, { name, description, category_id });
            }

            // 2. Cập nhật Location (lat, lng, address)
            await locationController.updateLocation(location, { lat, lng, address }, opts);

            // 3. Thay thế Assets nếu có images
            if (images !== undefined) {
                await assetController.replaceAssets(images, { location_id: location.id }, opts);
            }

            return location;
        });

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Updated',
            data: result,
        });
    });

    getAllLocations = asyncHandler(async (req, res) => {
        try {
            console.log("🔵 getAllLocations manager called");
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            
            console.log("📥 Query params - page:", page, "limit:", limit);
            
            const result = await locationController.getAllLocations(page, limit);
            console.log("✅ Controller returned:", result);
            
            const totalPages = Math.ceil(result.count / result.limit);
            
            return sendSuccess(res, {
                statusCode: 200,
                message: 'OK',
                data: result.rows,
                meta: {
                    total: result.count,
                    count: result.rows.length,
                    page: result.page,
                    limit: result.limit,
                    totalPages: totalPages,
                },
            });
        } catch (err) {
            console.error("🔴 getAllLocations manager error:", err.message);
            console.error("🔴 Error:", err);
            throw err;
        }
    });
getALocationsByCategory = asyncHandler(async (req, res) => {
        try {
            console.log("🔵 getLocationsByCategory manager called");
            const categoryId = Number(req.params.categoryId);
            if (!Number.isInteger(categoryId) || categoryId <= 0) {
                throw new HttpError(400, 'categoryId phải là một số nguyên dương');
            }

            const locations = await locationController.getLocationsByCategory(categoryId);
            return sendSuccess(res, {
                statusCode: 200,
                message: 'OK',
                data: locations,
                meta: {
                    count: locations.length,
                    category_id: categoryId,
                },
            });
        } catch (err) {
            console.error("🔴 getLocationsByCategory manager error:", err.message);
            console.error("🔴 Error:", err);
            throw err;
        }
    });
    getAssetsByLocationId = asyncHandler(async (req, res) => {
        const locationId = Number(req.params.locationId);
        if (!Number.isInteger(locationId) || locationId <= 0) {
            throw new HttpError(400, 'locationId phải là một số nguyên dương');
        }

        const assets = await assetController.getAssets({ location_id: locationId });
        
        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: assets,
            meta: {
                count: assets.length,
                location_id: locationId,
            },
        });
    });
}

module.exports = new LocationManager();
