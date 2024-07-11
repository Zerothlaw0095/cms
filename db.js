const mongoose = require('mongoose');
const { ModuleCacheMap } = require('vite/runtime');

function connect() {
    mongoose.connect('mongodb://127.0.0.1:27017/complaintapp')
        .then(() => {
            console.log('Connected to MongoDB');
            
        })
        .catch((error) => {
            console.error('Error connecting to MongoDB', error);
        });
}
module.exports = connect;

