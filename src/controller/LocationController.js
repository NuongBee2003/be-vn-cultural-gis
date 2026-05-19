const locationManager = require('../manager/locationManager');

class LocationController{
    async getAllLocations(req,res){
        try {
            const locations = await locationManager.getAllLocations();
            res.status(200).json(locations);
        } catch (error) {            
            console.log("ERROR: " + error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async getLocationsByGeo(req, res) {
        try {
            const locations = await locationManager.getLocationsByViewport(req.query);
            res.status(200).json(locations);
        } catch (error) {
            console.log("ERROR: " + error);
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                message: statusCode === 500 ? "Internal server error" : error.message
            });
        }
    }

    async create(req,res){
        try {
            const location = await locationManager.createLocation(req.body);
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
            const location = await locationManager.getLocationById(id);
            if (!location) {
                return res.status(404).json({ message: "Location not found" });
            }
            await locationManager.deleteLocation(location);
            res.status(200).json({ message: "Location deleted successfully" });
        }
        catch (error) {
            console.log("ERROR: " + error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

module.exports = new LocationController();
