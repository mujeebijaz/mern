const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt =  require('jsonwebtoken');
const config = require('config')
const { check, validationResult } = require('express-validator');

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);   
    } catch (error) {
        res.status(500).json({ msg: 'Server erro' });
    }
});

router.post('/', [
    check('email', 'Please include an email').isEmail(),
    check('password', 'Please is required').exists()
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()});
    }

    const { email, password} = req.body;

    try {
        let user = await User.findOne({email});
        if(!user){
            return res.status(400).json({errors : [{msg: 'Invalid credentials'}]});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({errors : [{msg: 'Invalid credentials'}]});
        }
        

        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(payload,
        config.get('jwtSecret'),
        { expiresIn: 3600000 },
        (err, token) => {
            if (err) throw err;
            res.json({ token });
        }
        );

    } catch (error) {
        console.log(error.message);
        res.status(500).send('There is a server error');
        
    }

});

module.exports = router;