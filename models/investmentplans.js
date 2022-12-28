const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const investmentplanSchema = new Schema({
    investmentType: {
        type: String,
        required: true,
        enum: ['Forex', 'Stocks', 'Crypto Mining']
    },
    packagename: String,
    minimumamount: Number,
    maximumamount: Number,
    duration: String,
    profitpercentage: String,
    charges: String,
    power: String,
    storage: String
})



module.exports = mongoose.model('InvestmentPlan', investmentplanSchema);