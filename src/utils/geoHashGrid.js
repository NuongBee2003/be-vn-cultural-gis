/**
 * GeoHash Grid Utility
 *
 * Chia một bounding box thành lưới N×M ô đều nhau.
 * Mỗi ô được dùng để query DB độc lập → đảm bảo phân bố đều trên bản đồ.
 *
 * Không dùng thư viện GeoHash phức tạp — chỉ dùng arithmetic lat/lng thuần.
 * Works với MySQL + Sequelize, không cần PostGIS.
 */

/**
 * Tính số ô lưới phù hợp dựa trên kích thước bbox.
 * Bbox nhỏ (zoom in) → ít ô hơn. Bbox lớn (zoom out) → nhiều ô hơn.
 *
 * @param {number} lngRange - khoảng lng (maxLng - minLng)
 * @param {number} latRange - khoảng lat (maxLat - minLat)
 * @returns {{ cols: number, rows: number }}
 */
const calcGridDimensions = (lngRange, latRange) => {
    // Heuristic: ~1 ô per 0.04 độ (≈ 4.5km), tối thiểu 2×2, tối đa 5×5
    // Max 5×5=25 cells để tránh vượt connection pool DB cloud (max 5)
    const cols = Math.min(5, Math.max(2, Math.round(lngRange / 0.04)));
    const rows = Math.min(5, Math.max(2, Math.round(latRange / 0.04)));
    return { cols, rows };
};

/**
 * Chia bbox thành lưới ô nhỏ hơn.
 *
 * @param {{ minLng: number, minLat: number, maxLng: number, maxLat: number }} bounds
 * @param {{ cols?: number, rows?: number }} [options] - override grid dimensions
 * @returns {Array<{ minLng, minLat, maxLng, maxLat, cellKey: string }>}
 */
const buildGrid = (bounds, options = {}) => {
    const { minLng, minLat, maxLng, maxLat } = bounds;

    const lngRange = maxLng - minLng;
    const latRange = maxLat - minLat;

    const auto = calcGridDimensions(lngRange, latRange);
    const cols = options.cols ?? auto.cols;
    const rows = options.rows ?? auto.rows;

    const cellLngSize = lngRange / cols;
    const cellLatSize = latRange / rows;

    const cells = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cMinLng = minLng + col * cellLngSize;
            const cMinLat = minLat + row * cellLatSize;
            const cMaxLng = cMinLng + cellLngSize;
            const cMaxLat = cMinLat + cellLatSize;

            // Key cho Redis — làm tròn 4 chữ số (~11m precision)
            const cellKey = `geo_cell:${cMinLng.toFixed(4)},${cMinLat.toFixed(4)},${cMaxLng.toFixed(4)},${cMaxLat.toFixed(4)}`;

            cells.push({
                minLng: cMinLng,
                minLat: cMinLat,
                maxLng: cMaxLng,
                maxLat: cMaxLat,
                cellKey,
            });
        }
    }

    return cells;
};

/**
 * Tính số item mỗi ô cần lấy để tổng xấp xỉ `totalLimit`.
 * Tối thiểu 1 item/ô để không bỏ trống vùng có data.
 *
 * @param {number} totalLimit
 * @param {number} cellCount
 * @returns {number} perCell
 */
const calcPerCell = (totalLimit, cellCount) => {
    return Math.max(1, Math.ceil(totalLimit / cellCount));
};

/**
 * Chạy các promise theo từng batch nhỏ tránh vượt connection pool.
 *
 * @template T
 * @param {Array<() => Promise<T>>} tasks - mảng factory functions (không phải promise sẵn)
 * @param {number} [batchSize=4] - số task chạy song song mỗi batch
 * @returns {Promise<T[]>}
 */
const runInBatches = async (tasks, batchSize = 2) => {
    const results = [];
    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map((fn) => fn()));
        results.push(...batchResults);
    }
    return results;
};

module.exports = { buildGrid, calcPerCell, calcGridDimensions, runInBatches };
