const express = require('express');
const router = express.Router();
const { authMiddleware, getPasswordHash } = require('../middleware/auth');

// Change password endpoint
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { new_password } = req.body;
        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ detail: "Password must be at least 6 characters long" });
        }
        const hashedPassword = await getPasswordHash(new_password);
        req.user.hashed_password = hashedPassword;
        req.user.temp_password = new_password; // Store temp password as reference if needed
        await req.user.save();
        res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ detail: "Internal Server Error" });
    }
});

// Update Zoom API Credentials (instructor only)
router.post('/zoom-credentials', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "instructor") {
            return res.status(403).json({ detail: "Only instructors can update Zoom credentials" });
        }
        const { account_id, client_id, client_secret } = req.body;
        
        req.user.zoom_account_id = account_id;
        req.user.zoom_client_id = client_id;
        req.user.zoom_client_secret = client_secret;
        
        await req.user.save();
        res.json({ message: "Zoom API Credentials updated successfully" });
    } catch (error) {
        console.error("Zoom credentials save error:", error);
        res.status(500).json({ detail: "Internal Server Error" });
    }
});

module.exports = router;
