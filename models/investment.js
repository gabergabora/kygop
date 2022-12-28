const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const investmentSchema = new Schema({
    investmentdate: String,
    investmentType: {
        type: String,
        required: true,
        enum: ['Forex', 'Stocks', 'Crypto Mining']
    },
    packagetype: String,
    minimumamount: Number,
    maximumamount: Number,
    duration: String,
    profitpercentage: String,
    charges: String,
    status: {
        type: String,
        required: true,
        default: 'Pending',
        enum: ['Pending', 'Active', 'Completed']
    },
    investedamount: Number,
    investmentprofit: Number,
    cryptocurrency: String,
    power: String,
    storage: String
})



module.exports = mongoose.model('Investment', investmentSchema);