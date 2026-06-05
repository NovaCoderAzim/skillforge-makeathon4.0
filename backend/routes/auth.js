const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { getPasswordHash, verifyPassword, createAccessToken, authMiddleware } = require('../middleware/auth');

router.post('/users', async (req, res) => {
    try {
        const { email, password, name, role, phone_number } = req.body;
        
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ detail: "Email already registered" });
        }
        
        const hashedPassword = await getPasswordHash(password);
        await User.create({
            email,
            hashed_password: hashedPassword,
            full_name: name,
            role,
            phone_number
        });
        
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Internal Server Error" });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body; // OAuth2PasswordRequestForm uses 'username' and 'password'
        
        const user = await User.findOne({ where: { email: username } });
        if (!user || !(await verifyPassword(password, user.hashed_password))) {
            return res.status(401).json({ detail: "Incorrect email or password" });
        }
        
        const token = createAccessToken({ sub: user.email, role: user.role });
        
        res.json({ access_token: token, token_type: "bearer", role: user.role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Internal Server Error" });
    }
});

module.exports = router;
