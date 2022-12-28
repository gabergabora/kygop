const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_100');
});

const transactionSchema = new Schema({
    transactiondate: String,
    transactionmethod: String,
    transactionType: {
        type: String,
        required: true,
        enum: ['Deposit', 'Withdraw', 'Internal Transfer', 'Referral Earnings', 'Payment']
    },
    amount: Number,
    status: {
        type: String,
        required: true,
        default: 'Pending',
        enum: ['Pending', 'Unsucessful', 'Successful']
    },
    transactionproof: [ImageSchema],
    validateUser: {type: Schema.Types.ObjectId, ref: 'Users'},
    withdrawaddress: String,
    narration: String
})



module.exports = mongoose.model('Transaction', transactionSchema);