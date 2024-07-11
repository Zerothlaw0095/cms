const express = require('express');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const Handlebars = require('handlebars');
const { body, validationResult } = require('express-validator');
const exphbs = require('express-handlebars');
const connectDB = require('./db');

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Load Routes
const indexRoutes = require('./routes/index');

// View Engine
app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
Handlebars.default = Handlebars.default || {};
Handlebars.default.defaultOptions = Handlebars.default.defaultOptions || {};
Handlebars.default.defaultOptions.allowProtoMethodsByDefault = true;
Handlebars.default.defaultOptions.allowProtoPropertiesByDefault = true;

// Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Express Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true,
    cookie: { httpOnly: true, maxAge: 2419200000 } // configure when sessions expire
}));


// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Flash Messages
app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

// Use Routes
app.use('/', indexRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Set Port
const port = process.env.PORT || 3000;

// Start Server
app.listen(port, () => {
    console.log('Server started on port ' + port);
});

module.exports = app;
