const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');


const reviewSchema = new mongoose.Schema({
    reviewdate: String,
    username: String,
    comment: String,
    status: {
        type: String,
        required: true,
        default: 'Unverified',
        enum: ['Unverified', 'Verified']
    },
})

module.exports = mongoose.model('Review', reviewSchema);