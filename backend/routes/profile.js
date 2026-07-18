const express = require('express');
const router = express.Router();
const { User, SchoolClass } = require('../models');
const { authMiddleware, getPasswordHash, verifyPassword } = require('../middleware/auth');

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{ model: SchoolClass, as: 'schoolClass' }]
        });
        
        if (!user) {
            return res.status(404).json({ detail: "User not found" });
        }

        // Return user data (excluding password)
        res.json({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            profile_picture_url: user.profile_picture_url,
            phone_number: user.phone_number,
            school_class_id: user.school_class_id,
            section: user.section,
            class_name: user.schoolClass ? user.schoolClass.name : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Internal Server Error" });
    }
});

// Update user profile (Name, Picture, Class/Section for student)
router.put('/update', authMiddleware, async (req, res) => {
    try {
        const { full_name, profile_picture_url, school_class_id, section } = req.body;
        
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ detail: "User not found" });

        // Update basic info
        if (full_name) user.full_name = full_name;
        if (profile_picture_url !== undefined) user.profile_picture_url = profile_picture_url;

        // If student, update class info if provided
        if (user.role === 'student') {
            if (school_class_id) user.school_class_id = school_class_id;
            if (section) user.section = section;
        }

        await user.save();
        res.json({ message: "Profile updated successfully", profile_picture_url: user.profile_picture_url, full_name: user.full_name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Internal Server Error" });
    }
});

// Update user password
router.put('/password', authMiddleware, async (req, res) => {
    try {
        const { old_password, new_password } = req.body;
        
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ detail: "User not found" });

        // Verify old password
        const isValid = await verifyPassword(old_password, user.hashed_password);
        if (!isValid) {
            return res.status(400).json({ detail: "Incorrect current password" });
        }

        // Hash and set new password
        user.hashed_password = await getPasswordHash(new_password);
        await user.save();

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Internal Server Error" });
    }
});

module.exports = router;
