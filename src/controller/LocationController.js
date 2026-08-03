const { Op } = require("sequelize");
const db = require("../models");
const HttpError = require("../utils/httpError");

const Location = db.Location;

class LocationController {
  parsePositiveInt(value, fieldName) {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
      throw new HttpError(400, `${fieldName} phải là một số nguyên dương`);
    }
    return parsed;
  }

  /**
   * GeoHash Grid Sampling Query
   * Với mỗi ô trong cells[], chạy query riêng lấy tối đa perCell items.
   * Kết quả từ nhiều ô được merge + dedup theo id.
   *
   * @param {Array<{minLng,minLat,maxLng,maxLat}>} cells - danh sách ô lưới
   * @param {number} perCell - số item tối đa mỗi ô
   * @returns {Promise<Array>} mảng location đã dedup
   */
  async getLocationsByGeoHashGrid(cells, perCell) {
    const { runInBatches } = require('../utils/geoHashGrid');

    // Chạy theo batch 4 cells — tránh vượt max_user_connections của DB cloud
    const cellResults = await runInBatches(
      cells.map((cell) => () =>
        Location.findAll({
          attributes: ['id', 'lat', 'lng', 'address', 'place_id', 'status'],
          where: {
            lat: { [Op.between]: [cell.minLat, cell.maxLat] },
            lng: { [Op.between]: [cell.minLng, cell.maxLng] },
          },
          include: [
            {
              model: db.Place,
              as: 'place',
              attributes: ['id', 'name', 'description'],
              required: true,
              include: [
                {
                  model: db.Category,
                  as: 'category',
                  attributes: ['id', 'name', 'icon_marker', 'color'],
                  required: false,
                },
              ],
            },
          ],
          limit: perCell,
          order: [['id', 'ASC']],
        })
      ),
      2  // batch size = 2 (DB cloud max_user_connections = 5, server dùng ~2-3)
    );

    // Merge tất cả kết quả, dedup theo id
    const seen = new Set();
    const merged = [];
    for (const rows of cellResults) {
      for (const row of rows) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          merged.push(row);
        }
      }
    }

    return merged;
  }

  async createLocation(payload, options = {}) {
    const { transaction } = options;
    const { lat, lng, address, place_id } = payload;

    const parsedPlaceId = this.parsePositiveInt(place_id, "place_id");

    let parsedLat = null;
    if (lat !== undefined && lat !== null) {
      parsedLat = Number(lat);
      if (Number.isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        throw new HttpError(400, "lat phải là một số giữa -90 và 90");
      }
    }

    let parsedLng = null;
    if (lng !== undefined && lng !== null) {
      parsedLng = Number(lng);
      if (Number.isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        throw new HttpError(400, "lng phải là một số giữa -180 và 180");
      }
    }

    const location = await Location.create(
      {
        lat: parsedLat,
        lng: parsedLng,
        address,
        place_id: parsedPlaceId,
      },
      transaction ? { transaction } : undefined,
    );

    await db.Place.update(
      { updated_at: new Date() },
      { where: { id: parsedPlaceId }, ...(transaction ? { transaction } : {}) },
    );

    return location;
  }

  async getLocationById(id) {
    return Location.findByPk(id, {
      include: [
        {
          model: db.Place,
          as: "place",
          attributes: ["id", "name", "description", "category_id"],
          include: [
            {
              model: db.Category,
              as: "category",
              attributes: ["id", "name", "icon_marker", "color"],
              required: false,
            },
          ],
        },
      ],
    });
  }

  async deleteLocation(location) {
    const placeId = location.place_id;
    const deleted = await location.destroy();
    if (placeId) {
      await db.Place.update(
        { updated_at: new Date() },
        { where: { id: placeId } },
      );
    }
    return deleted;
  }

  async updateLocation(location, payload, options = {}) {
    const { transaction } = options;
    const { lat, lng, address } = payload;

    const updateData = {};

    if (lat !== undefined && lat !== null) {
      const parsedLat = Number(lat);
      if (Number.isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        throw new HttpError(400, "lat phải là một số giữa -90 và 180");
      }
      updateData.lat = parsedLat;
    }

    if (lng !== undefined && lng !== null) {
      const parsedLng = Number(lng);
      if (Number.isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        throw new HttpError(400, "lng phải là một số giữa -180 và 180");
      }
      updateData.lng = parsedLng;
    }

    if (address !== undefined) {
      updateData.address = address;
    }

    if (Object.keys(updateData).length > 0) {
      await location.update(
        updateData,
        transaction ? { transaction } : undefined,
      );
    }

    return location;
  }

  async getLocationsByCategory(categoryId) {
    return Location.findAll({
      attributes: ["id", "lat", "lng", "address", "place_id", "status"],
      include: [
        {
          model: db.Place,
          as: "place",
          attributes: ["id", "name", "description", "category_id"],
          where: { category_id: categoryId },
          required: true,
          include: [
            {
              model: db.Category,
              as: "category",
              attributes: ["id", "name", "icon_marker", "color"],
              required: false,
            },
          ],
        },
      ],
    });
  }

  async getLocationsByCategoryPaginated(categoryId, page = 1, limit = 10) {
    const parsedCategoryId = this.parsePositiveInt(categoryId, "categoryId");
    const parsedPage = this.parsePositiveInt(page, "page");
    const parsedLimit = Math.min(this.parsePositiveInt(limit, "limit"), 100); // tối đa 100
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows } = await Location.findAndCountAll({
      attributes: ["id", "lat", "lng", "address", "place_id", "status"],
      include: [
        {
          model: db.Place,
          as: "place",
          attributes: ["id", "name", "description", "category_id"],
          where: { category_id: parsedCategoryId },
          required: true,
          include: [
            {
              model: db.Category,
              as: "category",
              attributes: ["id", "name", "icon_marker", "color"],
              required: false,
            },
          ],
        },
        {
          model: db.Asset,
          as: "assets",
          attributes: ["id", "url", "is_primary"],
          required: false,
          where: { post_id: null, review_id: null },
        },
      ],
      limit: parsedLimit,
      offset,
      distinct: true, // cần thiết khi có include để đếm đúng
    });

    return {
      rows,
      count,
      page: parsedPage,
      limit: parsedLimit,
    };
  }

  async getAllLocations(page = 1, limit = 20) {
    const parsedPage = this.parsePositiveInt(page, "page");
    const parsedLimit = this.parsePositiveInt(limit, "limit");
    const offset = (parsedPage - 1) * parsedLimit;

    try {
      const { count, rows } = await Location.findAndCountAll({
        attributes: ["id", "lat", "lng", "address", "place_id", "status"],
        include: [
          {
            model: db.Place,
            as: "place",
            attributes: ["id", "name", "description", "category_id"],
            required: true,
            include: [
              {
                model: db.Category,
                as: "category",
                attributes: ["id", "name", "icon_marker", "color"],
                required: false,
              },
            ],
          },
          {
            model: db.Asset,
            as: "assets",
            attributes: ["id", "url", "is_primary"],
            required: false,
          },
        ],
        limit: parsedLimit,
        offset,
        order: [["id", "ASC"]],
        distinct: true, // cần thiết khi có include để đếm đúng
      });

      return {
        rows,
        count,
        page: parsedPage,
        limit: parsedLimit,
      };
    } catch (err) {
      throw err;
    }
  }
  async getAllLocationsByCategory(page = 1, limit = 20, categoryId) {
    const parsedPage = this.parsePositiveInt(page, "page");
    const parsedLimit = this.parsePositiveInt(limit, "limit");
    const offset = (parsedPage - 1) * parsedLimit;

    try {
      const { count, rows } = await Location.findAndCountAll({
        attributes: ["id", "lat", "lng", "address", "place_id", "status"],
        include: [
          {
            model: db.Place,
            as: "place",
            attributes: ["id", "name", "description", "category_id"],
            where: { category_id: categoryId },
            required: true,
            include: [
              {
                model: db.Category,
                as: "category",
                attributes: ["id", "name", "icon_marker", "color"],
                required: false,
              },
            ],
          },
          {
            model: db.Asset,
            as: "assets",
            attributes: ["id", "url", "is_primary"],
            required: false,
          },
        ],
        limit: parsedLimit,
        offset,
        order: [["id", "ASC"]],
        distinct: true,
      });

      return {
        rows,
        count,
        page: parsedPage,
        limit: parsedLimit,
      };
    } catch (err) {
      throw err;
    }
  }
}

module.exports = new LocationController();
