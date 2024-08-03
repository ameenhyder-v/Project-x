const Category = require("../Model/categoryModel")

const addCategory = async (req, res) => {
    try {
        const { category, gender, description } = req.body;
        const genderArray = ["Male", "Female"]



        if (!category || category.trim() === "") {
            return res.render("categories", { Data: categoryData, message: "fill the field of category" })
        }

        if (!gender || !genderArray.includes(gender)) {
            req.flash("message", "Please seclect a gender")
            return res.redirect("/admin/categories")
        }

        if (!description || description.trim() === "") {
            req.flash("message", "Please fill the descriprion field!")
            return res.redirect("/admin/categories")
        }

        const existingCategory = await Category.findOne({ category: category, gender: gender });

        if (existingCategory) {
            req.flash("message", "Category already existe same name and same gender")
            return res.redirect("/admin/categories")
        }

        const newCategory = new Category({
            category: category,
            gender: gender,
            description: description
        });
        const savedCategory = await newCategory.save();
        if (savedCategory) {
            return res.redirect("/admin/categories")
        }

    } catch (error) {
        console.log(`error from the categoryController. updateCategory : ${error.message}`)
    }

}


const deleteCategory = async (req,res) => {
    try {
        const { id } = req.query;

        if (id) {
            const deleteData = await Category.findOneAndDelete({ _id: id });
            if (deleteData) {
                return res.send({ status: 200, message: "Category deleted successfully" });
            } else {
                return res.send({ status: 200, fail: "Category not found" });
            }
        } else {

            return res.status(200).fail("Not get Id"); 
        }
    }catch (error) {
        console.log(`error from the categoryController.deleteCategory: ${error.message}`)
    }
}

const checkCategory = async (req, res) => {
    try {
        const {gender} = req.query
        const Data = await Category.find({ gender: gender }, {_id: 0, category: 1 });
        // console.log(Data);
        if(Data){
            res.json(Data)
        }
    } catch (error) {
        console.log(`error from the categoryController.checkCategory: ${error}`)
    }
}

const getingId = async function (gender, category){
    try {
        
        const Data = await Category.findOne({ category: category, gender: gender })
        // console.log(Data._id)
        return Data._id;

    } catch (error) {
        console.log(`error from the categoryController.gettingId: ${error.message}`)
    }
}

const getCatEdit = async (req, res) => {
    try {
        const categoryId = req.query.categoryId;
        const category = await Category.findById(categoryId);
        res.json(category);
    } catch (error) {
        console.log(`error from the category controller getCatEdit`)
        res.json({ error: 'An error occurred while fetching the category data.' });
    }
}


const updateCategory = async (req, res) => {
    try {
        const { categoryId, category, gender, description } = req.body;
        console.log(categoryId, "----------", category, "----------", gender, "-----------", description)
        const genderArray = ["Male", "Female"];

        if (!category || category.trim() === "") {
            return res.status(400).json({ message: "Fill the field of category", categoryData });
        }

        if (!gender || !genderArray.includes(gender)) {
            return res.status(400).json({ message: "Please select a gender", categoryData });
        }

        if (!description || description.trim() === "") {
            return res.status(400).json({ message: "Please fill the description field", categoryData });
        }

        const existingCategory = await Category.findOne({ category: category, gender: gender });

        if (existingCategory) {
            return res.status(400).json({ message: "Category with the same name and gender already exists" });
        }

        const updatedata = await Category.findByIdAndUpdate(categoryId, { category: category, gender: gender, description: description });

        if (!updatedata){
            return res.status(400).json({ message: "Something went wrong! Try again" })
        }

        res.status(200).json({ message: "Category updated successfully" });

    } catch (error) {
        console.log(`Error from the category controller updateCategory - ${error}`);
        res.status(500).json({ message: "An unexpected error occurred" });
    }
}


module.exports = {
    addCategory,
    deleteCategory,
    checkCategory,
    getingId,
    getCatEdit,
    updateCategory
}