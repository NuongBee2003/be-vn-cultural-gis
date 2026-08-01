const { Op } = require('sequelize');
const db = require('../models');
const { Holiday } = db;

class HolidayController {
    async getAllHolidays(req, res) {
        try {
            const { page, limit, search, category } = req.query;

            const whereClause = {};
            if (search) {
                whereClause[Op.or] = [
                    { name: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } }
                ];
            }
            if (category) {
                whereClause.category = category;
            }

            const queryOptions = {
                where: whereClause,
                include: [
                    {
                        model: db.HolidayPlace,
                        as: 'holiday_places',
                        include: [
                            {
                                model: db.Place,
                                as: 'place',
                                attributes: ['id', 'name', 'description', 'category_id'],
                                include: [
                                    {
                                        model: db.Category,
                                        as: 'category',
                                        attributes: ['id', 'name', 'icon_marker', 'color'],
                                        required: false
                                    },
                                    {
                                        model: db.Location,
                                        as: 'locations',
                                        attributes: ['id', 'lat', 'lng', 'address', 'place_id']
                                    }
                                ]
                            }
                        ]
                    }
                ],
                order: [['id', 'DESC']]
            };

            if (page) {
                const parsedPage = parseInt(page, 10) || 1;
                const parsedLimit = parseInt(limit, 10) || 10;
                queryOptions.offset = (parsedPage - 1) * parsedLimit;
                queryOptions.limit = parsedLimit;

                const { count, rows } = await Holiday.findAndCountAll(queryOptions);
                
                const mappedRows = rows.map(h => {
                    const locations = [];
                    const holidayPlaces = h.holiday_places || [];
                    holidayPlaces.forEach(hp => {
                        const place = hp.place;
                        if (place) {
                            const placeLocs = place.locations || [];
                            placeLocs.forEach(loc => {
                                locations.push({
                                    id: loc.id,
                                    lat: loc.lat,
                                    lng: loc.lng,
                                    address: loc.address,
                                    place_id: loc.place_id,
                                    place: {
                                        id: place.id,
                                        name: place.name,
                                        description: place.description,
                                        category_id: place.category_id,
                                        category: place.category
                                    }
                                });
                            });
                        }
                    });

                    const plainHoliday = h.get({ plain: true });
                    plainHoliday.locations = locations;
                    plainHoliday.place_ids = holidayPlaces.map(hp => hp.place_id);
                    plainHoliday.places = holidayPlaces.map(hp => hp.place ? { id: hp.place.id, name: hp.place.name } : null).filter(Boolean);
                    return plainHoliday;
                });

                return res.status(200).json({
                    success: true,
                    data: mappedRows,
                    pagination: {
                        totalItems: count,
                        totalPages: Math.ceil(count / parsedLimit),
                        page: parsedPage,
                        limit: parsedLimit
                    }
                });
            }

            const holidays = await Holiday.findAll(queryOptions);
            const mappedHolidays = holidays.map(h => {
                const locations = [];
                const holidayPlaces = h.holiday_places || [];
                holidayPlaces.forEach(hp => {
                    const place = hp.place;
                    if (place) {
                        const placeLocs = place.locations || [];
                        placeLocs.forEach(loc => {
                            locations.push({
                                id: loc.id,
                                lat: loc.lat,
                                lng: loc.lng,
                                address: loc.address,
                                place_id: loc.place_id,
                                place: {
                                    id: place.id,
                                    name: place.name,
                                    description: place.description,
                                    category_id: place.category_id,
                                    category: place.category
                                }
                            });
                        });
                    }
                });

                const plainHoliday = h.get({ plain: true });
                plainHoliday.locations = locations;
                plainHoliday.place_ids = holidayPlaces.map(hp => hp.place_id);
                plainHoliday.places = holidayPlaces.map(hp => hp.place ? { id: hp.place.id, name: hp.place.name } : null).filter(Boolean);
                return plainHoliday;
            });

            return res.status(200).json({ success: true, data: mappedHolidays });
        } catch (error) {
            console.error('ERROR in getAllHolidays:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async createHoliday(req, res) {
        const transaction = await db.sequelize.transaction();
        try {
            const { category, date_label, name, description, image_url, history, activities, place_ids, foods } = req.body;
            if (!category || !date_label || !name) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'category, date_label và name là bắt buộc' });
            }

            const newHoliday = await Holiday.create({
                category,
                date_label,
                name,
                description,
                image_url,
                history,
                activities: activities ? (typeof activities === 'string' ? JSON.parse(activities) : activities) : null,
                foods: foods ? (typeof foods === 'string' ? JSON.parse(foods) : foods) : null
            }, { transaction });

            let parsedPlaceIds = [];
            if (place_ids) {
                parsedPlaceIds = typeof place_ids === 'string' ? JSON.parse(place_ids) : place_ids;
            }
            if (Array.isArray(parsedPlaceIds)) {
                for (const pId of parsedPlaceIds) {
                    await db.HolidayPlace.create({
                        holiday_id: newHoliday.id,
                        place_id: parseInt(pId, 10)
                    }, { transaction });
                }
            }

            await transaction.commit();
            return res.status(201).json({ success: true, data: newHoliday });
        } catch (error) {
            await transaction.rollback();
            console.error('ERROR in createHoliday:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async updateHoliday(req, res) {
        const transaction = await db.sequelize.transaction();
        try {
            const id = req.params.id;
            const holiday = await Holiday.findByPk(id, { transaction });
            if (!holiday) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Không tìm thấy ngày lễ này' });
            }

            const { category, date_label, name, description, image_url, history, activities, place_ids, foods } = req.body;

            await holiday.update({
                category: category !== undefined ? category : holiday.category,
                date_label: date_label !== undefined ? date_label : holiday.date_label,
                name: name !== undefined ? name : holiday.name,
                description: description !== undefined ? description : holiday.description,
                image_url: image_url !== undefined ? image_url : holiday.image_url,
                history: history !== undefined ? history : holiday.history,
                activities: activities !== undefined ? (typeof activities === 'string' ? JSON.parse(activities) : activities) : holiday.activities,
                foods: foods !== undefined ? (typeof foods === 'string' ? JSON.parse(foods) : foods) : holiday.foods
            }, { transaction });

            if (place_ids !== undefined) {
                await db.HolidayPlace.destroy({
                    where: { holiday_id: holiday.id },
                    transaction
                });

                let parsedPlaceIds = [];
                if (place_ids) {
                    parsedPlaceIds = typeof place_ids === 'string' ? JSON.parse(place_ids) : place_ids;
                }
                if (Array.isArray(parsedPlaceIds)) {
                    for (const pId of parsedPlaceIds) {
                        await db.HolidayPlace.create({
                            holiday_id: holiday.id,
                            place_id: parseInt(pId, 10)
                        }, { transaction });
                    }
                }
            }

            await transaction.commit();
            return res.status(200).json({ success: true, data: holiday });
        } catch (error) {
            await transaction.rollback();
            console.error('ERROR in updateHoliday:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async deleteHoliday(req, res) {
        try {
            const id = req.params.id;
            const holiday = await Holiday.findByPk(id);
            if (!holiday) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy ngày lễ này' });
            }

            await holiday.destroy();
            return res.status(200).json({ success: true, message: 'Xóa thành công' });
        } catch (error) {
            console.error('ERROR in deleteHoliday:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new HolidayController();
