const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
    const { fullName, phone, password, state, district, landSizeAcres } = req.body;
    try {
        const userExists = await User.findOne({ phone });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ fullName, phone, passwordHash: password, state, district, landSizeAcres });
        if (user) {
            res.status(201).json({
                _id: user._id, fullName: user.fullName, phone: user.phone,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    const { phone, password } = req.body;
    try {
        const user = await User.findOne({ phone });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id, fullName: user.fullName, phone: user.phone, state: user.state,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid phone or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        res.json({ _id: user._id, fullName: user.fullName, phone: user.phone, state: user.state, district: user.district });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = { registerUser, loginUser, getUserProfile };
