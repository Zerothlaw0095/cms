const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const { check, validationResult } = require('express-validator');
const Complaint = require('../models/complaint');
const ComplaintMapping = require('../models/complaint-mapping');

// Home Page - Dashboard
router.get('/', ensureAuthenticated, (req, res, next) => {
    res.render('index');
});

// Login Form
router.get('/login', (req, res, next) => {
    res.render('login');
});

// Register Form
router.get('/register', (req, res, next) => {
    res.render('register');
});

// Logout
router.get('/logout', ensureAuthenticated, (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/login');
    });
});

// Admin Portal
router.get('/admin', ensureAuthenticated, (req, res, next) => {
    console.log('Admin page accessed by user:', req.user);
    if (req.user.role === 'admin') {
        // Fetch complaints and engineers
        Complaint.getAllComplaints((err, complaints) => {
            if (err) {
                console.error('Error fetching complaints:', err);
                return next(err);
            }

            User.getEngineer((err, engineers) => {
                if (err) {
                    console.error('Error fetching engineers:', err);
                    return next(err);
                }

                console.log('Complaints:', complaints);
                console.log('Engineers:', engineers);

                res.render('admin/admin', {
                    complaints: complaints,
                    engineers: engineers,
                    user: req.user
                });
            });
        });
    } else {
        req.flash('error_msg', 'You are not authorized to view this page');
        res.redirect('/');
    }
});

// Assign the Complaint to Engineer
router.post('/assign', [
    check('complaintID', 'Complaint ID is required').notEmpty(),
    check('engineerName', 'Engineer name is required').notEmpty()
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('admin/admin', {
            errors: errors.array()
        });
    }

    const newComplaintMapping = new ComplaintMapping({
        complaintID: req.body.complaintID,
        engineerName: req.body.engineerName,
    });

    ComplaintMapping.registerMapping(newComplaintMapping, (err, complaint) => {
        if (err) throw err;
        req.flash('success_msg', 'You have successfully assigned a complaint to Engineer');
        res.redirect('/admin/admin');
    });
});

// Junior Eng Route
router.get('/jeng', ensureAuthenticated, (req, res, next) => {
    try {
        res.render('layouts/junior/junior');
    } catch (err) {
        console.error('Error in junior route:', err);
        next(err); // Pass the error to the error-handling middleware
    }
});

// Complaint
router.get('/complaint', ensureAuthenticated, (req, res, next) => {
    res.render('complaint', {
        username: req.session.user,
    });
});

// Register a Complaint
router.post('/registerComplaint', [
    check('contact', 'Contact field is required').notEmpty(),
    check('desc', 'Description field is required').notEmpty()
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('complaint', {
            errors: errors.array()
        });
    }

    const newComplaint = new Complaint({
        name: req.body.name,
        email: req.body.email,
        contact: req.body.contact,
        desc: req.body.desc,
    });

    Complaint.registerComplaint(newComplaint)
    .then(complaint => {
        req.flash('success_msg', 'You have successfully launched a complaint');
        res.redirect('/');
    })
    .catch(err => {
        console.error(err);
        res.status(500).send('Internal Server Error');
    });
});

// Process Register
router.post('/register', [
    check('name', 'Name field is required').notEmpty(),
    check('email', 'Email field is required').notEmpty(),
    check('email', 'Email must be a valid email address').isEmail(),
    check('username', 'Username field is required').notEmpty(),
    check('password', 'Password field is required').notEmpty(),
    check('password2', 'Passwords do not match').custom((value, { req }) => value === req.body.password),
    check('role', 'Role option is required').notEmpty()
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('register', {
            errors: errors.array()
        });
    }

    const newUser = new User({
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role
    });

    User.registerUser(newUser, (err, user) => {
        if (err) throw err;
        req.flash('success_msg', 'You are Successfully Registered and can Log in');
        res.redirect('/login');
    });
});

// Local Strategy
passport.use(new LocalStrategy((username, password, done) => {
    User.getUserByUsername(username, (err, user) => {
        if (err) { 
            return done(err); }

        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }

        User.comparePassword(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing password:', err);
                return done(err);
            }
            if (isMatch) {
                console.log('Password match, user authenticated');
                return done(null, user);
            } else {
                console.log('Wrong password');
                return done(null, false, { message: 'Wrong password' });
            }
        });
    });
}));

passport.serializeUser((user, done) => {
    var sessionUser = {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
    }
    done(null, user._id);
});

passport.deserializeUser((id, done) => {
    User.getUserById(id, (err, sessionUser) => {
        done(err, sessionUser);
    });
});

// Login Processing
router.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
}), (req, res, next) => {
    req.session.save((err) => {
        if (err) {
            return next(err);
        }
        if (req.user.role === 'admin') {
            res.redirect('/admin');
        } else if (req.user.role === 'jeng') {
            res.redirect('/jeng');
        } else {
            res.redirect('/');
        }
    });
});

// Access Control
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('error_msg', 'You are not Authorized to view this page');
        res.redirect('/login');
    }
}

module.exports = router;
