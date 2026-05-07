const db = require('../models');
const Place = db.Place;

class PlaceController{
    async getAllPlaces(req,res){
        try {
            const places = await Place.findAll();
            res.status(200).json(places);
        } catch (error) {            
            console.log("ERROR: " + error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async create(req,res){
        try {
            const { name, description, category_id, status } = req.body;
            const place = await Place.create(
                { 
                    name,
                    description,
                    category_id,
                    status
                }
            );
            res.status(201).json(place);
        }
        catch (error) {
            console.log("ERROR: " + error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async delete(req,res){
        try {
            const { id } = req.params;
            const place = await Place.findByPk(id);
            if (!place) {
                return res.status(404).json({ message: "Place not found" });
            }
            await place.destroy();
            res.status(200).json({ message: "Place deleted successfully" });
        }
        catch (error) {
            console.log("ERROR: " + error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

module.exports = new PlaceController();