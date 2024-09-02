const Coupon = require('../Model/coupon-model');
const cron = require('node-cron');


//!AUTOMATICALY RUNNING FUNCTION
//? FOR CHECKING AND DELETE THE EXXPIRED COUPONS FROM THE DB
//// TODO WE HAVE SHEDULED THIS FUNCTION TO RUN IN 00:00 HOUR \\\\
cron.schedule('0 0 * * *', async () => {
    try {
        const now = new Date();
        await Coupon.deleteMany({ expires: { $lt: now } });
        console.log('Expired coupons deleted.');
    } catch (error) {
        console.error('Error deleting expired coupons:', error);
    }
});

//!LOADING THE COUPON PAGE ADMIN-SIDE
const coupon = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalCoupons = await Coupon.countDocuments({});
        const couponData = await Coupon.find({}).skip(skip).limit(limit).sort({ _id: -1 });

        const totalPages = Math.ceil(totalCoupons / limit);

        if (couponData) {
            res.render('coupon', {
                couponData: couponData,
                currentPage: page,
                totalPages: totalPages,
            });
        } else {
            res.render('coupon', {
                couponData: [],
                currentPage: page,
                totalPages: 0,
            });
        }
    } catch (error) {
        console.log(error);
    }
};


//!ADDIN COUPON USING FETCH
const addCoupon = async (req, res) => {
    try {

        const { coupon_name, amount, coupon_expires, coupon_code, minimum_amount, coupon_status } = req.body;
        const discountAmount = parseInt(amount);
        const minPurchaseAmount = parseInt(minimum_amount);

        if (!coupon_name || !amount || !coupon_expires || !coupon_code || !minimum_amount || coupon_status === undefined) {
            return res.json({ success: false, message: "All fields are required." });
        }
        //cheking the amount relation
        if (discountAmount >= minPurchaseAmount) {
            return res.json({ success: false, message: "Discount amount cannot be greater than the minimum spend amount." });
        }
        // checking the coupon code is already used
        const existingCoupon = await Coupon.findOne({ couponCode: coupon_code });
        if (existingCoupon) {
            return res.json({ success: false, message: "Coupon code already exists." });
        }
        //checking date
        const now = new Date();
        if (new Date(coupon_expires) <= now) {
            return res.json({ success: false, message: "Expiry date must be in the future." });
        }
        //checking status
        if (coupon_status.trim() !== 'true' && coupon_status.trim() !== 'false') {
            console.log(`--${coupon_status}---`)
            return res.json({ success: false, message: "Coupon status must be true or false." });
        }

        const newCoupon = new Coupon({
            name: coupon_name,
            amount,
            expires: coupon_expires,
            couponCode: coupon_code,
            minimumAmount: minimum_amount,
            status: coupon_status
        });

        const saving = await newCoupon.save();
        if (saving) {
            console.log('New coupon saved');
            return res.json({ success: true, message: "Coupon added successfully." });
        }

    } catch (error) {
        console.log(error)
    }
}

//!GETTING THE COUPON DATA FOR EDITNG IN THE MODAL
const getCouponForEdit = async (req, res) => {
    try {
        const { couponId } = req.query;
        const coupon = await Coupon.findById(couponId);
        if (coupon) {
            res.json({ success: true, coupon });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error('Error fetching coupon:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



//! UPDATING AFTER CHANGES MADE
const updateCoupon = async (req, res) => {
    try {
        const { id, name, amount, expires, couponCode, minimumAmount, status } = req.body;
        const discountAmount = parseInt(amount);
        const minPurchaseAmount = parseInt(minimumAmount);

        if (!name || !amount || !expires || !couponCode || !minimumAmount || status === undefined) {
            return res.json({ success: false, message: "All fields are required." });
        }
        //cheking the amount relation
        if (discountAmount >= minPurchaseAmount) {
            return res.json({ success: false, message: "Discount amount cannot be greater than the minimum spend amount." });
        }
        // checking the coupon code is already used
        const existingCoupon = await Coupon.find({ couponCode: couponCode });
        if (existingCoupon.length > 1) {
            return res.json({ success: false, message: "Coupon code already exists." });
        }
        //checking date
        const now = new Date();
        if (new Date(expires) <= now) {
            return res.json({ success: false, message: "Expiry date must be in the future." });
        }
        //checking status
        if (status.trim() !== 'true' && status.trim() !== 'false') {
            return res.json({ success: false, message: "Coupon status must be true or false." });
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(id, {
            name, amount, expires, couponCode, minimumAmount, status
        }, { new: true });

        if (updatedCoupon) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.body;

        if (!couponId) {
            return res.status(400).json({ success: false, message: 'Coupon ID is required' });
        }

        const removeCoupon = await Coupon.findOneAndDelete({ _id: couponId });

        if (removeCoupon) {
            return res.json({ success: true, message: 'Coupon deleted successfully' });
        } else {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'An error occurred while deleting the coupon' });
    }
};






const getCoupon = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const couponData = await Coupon.find({});
        res.json({ couponData, userId }); // Send userId along with couponData
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
};


const getAllCoupons = async (req, res) => {
    try {
        const allCoupons = await Coupon.find({})
        const allusebleCoupons = allCoupons.filter((coupons) => {
            return coupons.status = true
        })

        console.log(allusebleCoupons)

        res.status(200).json(allCoupons)
        
    } catch (error) {
        console.log(`error in coupon ${error.message}`)
    }
}


module.exports = {
    addCoupon,
    coupon,
    getCouponForEdit,
    updateCoupon,
    deleteCoupon,
    getCoupon,
    getAllCoupons
}