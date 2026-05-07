const db = require('../models');
const Category = db.Category;

class CategoryController{
    async getAllCategories(req,res){
        try {
            const categories = await Category.findAll();
            res.status(200).json(categories);
        } catch (error) {            
            console.log("ERROR: " + error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async create(req,res){
        try {
            const { name,icon_marker } = req.body;
            const category = await Category.create(
                { 
                    name,
                    icon_marker
                }
            );
            res.status(201).json(category);
        } catch (error) {
            console.log("ERROR: " + error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async delete(req,res){
        try {
            const { id } = req.params;
            const category = await Category.findByPk(id);
            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }
            await category.destroy();
            res.status(200).json({ message: "Category deleted successfully" });
        }
        catch (error) {
            console.log("ERROR: " + error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async update(req,res){
        try {
            const { id } = req.params;
            const { name,icon_marker } = req.body;
            const category = await Category.findByPk(id);
            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }
            category.name = name;
            category.icon_marker = icon_marker;
            await category.save();
            res.status(200).json(category);
        }
        catch (error) {
            console.log("ERROR: " + error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

module.exports = new CategoryController();