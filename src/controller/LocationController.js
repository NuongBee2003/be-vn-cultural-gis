const db = require('../models');
const Location = db.Location;

class LocationController{
    async getAllLocations(req,res){
        try {
            const locations = await Location.findAll();
            res.status(200).json(locations);
        } catch (error) {            
            console.log("ERROR: " + error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async create(req,res){
        try {
            const { lat , lng, province_id, status, address, place_id } = req.body;
            const location = await Location.create(
                { 
                    lat,
                    lng,
                    province_id,
                    status,
                    address,
                    place_id
                }
            );
            res.status(201).json(location);
        }
        catch (error) {
            console.log("ERROR: " + error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async delete(req,res){
        try {
            const { id } = req.params;
            const location = await Location.findByPk(id);
            if (!location) {
                return res.status(404).json({ message: "Location not found" });
            }
            await location.destroy();
            res.status(200).json({ message: "Location deleted successfully" });
        }
        catch (error) {
            console.log("ERROR: " + error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

module.exports = new LocationController();