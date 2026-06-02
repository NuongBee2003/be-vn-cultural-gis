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

    const snappedMinLng = snapToTile(minLng);
    const snappedMinLat = snapToTile(minLat);
    const snappedMaxLng = snapToTile(maxLng);
    const snappedMaxLat = snapToTile(maxLat);

    const tileKeys = [];
    for (let lat = snappedMinLat; lat <= snappedMaxLat; lat = parseFloat((lat + TILE_SIZE).toFixed(6))) {
        for (let lng = snappedMinLng; lng <= snappedMaxLng; lng = parseFloat((lng + TILE_SIZE).toFixed(6))) {
            tileKeys.push(`geo_tile:lat_${lat}:lng_${lng}`);
        }
    }

    return {
        tileKeys,
        snappedBbox: { minLng: snappedMinLng, minLat: snappedMinLat, maxLng: snappedMaxLng, maxLat: snappedMaxLat }
    };
};

module.exports = { getTileKeysFromBbox, TILE_SIZE };
