const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const referralSchema = new Schema({
    firstname: String,
    lastname: String,
    email: String
})



module.exports = mongoose.model('Referral', referralSchema);