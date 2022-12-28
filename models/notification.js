const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    notificationdate: String,
    title: String,
    message: String
})



module.exports = mongoose.model('Notification', notificationSchema);