/**
 * Geo Tile Utility
 * 
 * Chia bản đồ thành các ô lưới (tile) có kích thước cố định.
 * Bbox của user được snap về tile boundary → cùng khu vực = cùng cache key.
 * 
 * TILE_SIZE = 0.05 độ ≈ ~5.5km tại xích đạo — phù hợp cho GIS Việt Nam.
 * (Có thể điều chỉnh: 0.01 = ~1km, 0.1 = ~11km)
 */

const TILE_SIZE = 0.05;

/**
 * Snap một tọa độ về góc dưới-trái của tile chứa nó.
 * @param {number} value - lat hoặc lng
 * @returns {number} tọa độ đã snap, làm tròn 6 chữ số thập phân
 */
const snapToTile = (value) => {
    return parseFloat((Math.floor(value / TILE_SIZE) * TILE_SIZE).toFixed(6));
};

/**
 * Chuyển bbox gốc thành một hoặc nhiều tile keys bao phủ vùng đó.
 * Nếu bbox lớn hơn một tile, trả về nhiều tile (nhưng thường bbox viewport = 1-4 tile).
 * 
 * @param {string} bboxStr - "minLng,minLat,maxLng,maxLat"
 * @returns {{ tileKeys: string[], snappedBbox: object }}
 */
const getTileKeysFromBbox = (bboxStr) => {
    const parts = String(bboxStr).split(',').map((v) => Number(v.trim()));
    const [minLng, minLat, maxLng, maxLat] = parts;

    // Làm tròn 3 chữ số thập phân (khoảng ~111 mét)
    // Giúp các lượt kéo nhẹ bản đồ (pan) có cùng cache key
    const rMinLng = minLng.toFixed(3);
    const rMinLat = minLat.toFixed(3);
    const rMaxLng = maxLng.toFixed(3);
    const rMaxLat = maxLat.toFixed(3);

    const cacheKey = `geo_box:${rMinLng},${rMinLat},${rMaxLng},${rMaxLat}`;

    return {
        tileKeys: [cacheKey],
        snappedBbox: { minLng, minLat, maxLng, maxLat }
    };
};

module.exports = { getTileKeysFromBbox, TILE_SIZE };
