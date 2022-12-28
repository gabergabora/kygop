const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const Transaction = require('../models/transaction');
const Notification = require('../models/notification');

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_100');
});


const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: false,
        unique: false,
    },
    password: String,
    firstname: String, 
    lastname: String,
    confirmpassword: String,
    phonenumber: Number,
    gender: String,
    country: String,
    state: String,
    address: String,
    wallet: Number,
    totalprofits: {
        type: Number,
        default: 0
    },
    role: {
        type: String,
        required: true,
        default: 'client',
        enum: ['client', 'admin']
    },
    verificationstatus: {
        type: String,
        required: true,
        default: 'Not Verified',
        enum: ['Not Verified', 'Pending', 'Verified']
    },
    acctstatus: {
        type: String,
        required: true,
        default: 'Not Active',
        enum: ['Not Active', 'Active']
    },
    verificationdocument: [ImageSchema],
    passport: [ImageSchema],
    profilepicture: [ImageSchema],
    documenttype: String,
    transaction: [ 
        {
            type: Schema.Types.ObjectId,
            ref: 'Transaction'
        }
    ],
    investment: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Investment'
        }
    ],
    referredby: String,
    referralincomes: {
        type: Number,
        required: true,
        default: 0
    },
    notifications: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Notification'
        }
    ],
    referrals: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Referral'
        }
    ],
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    support: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Support'
        }
    ],
    accountchargesStatus: {
        type: String,
        required: true,
        default: 'Unpaid',
        enum: ['Paid', 'Pending', 'Unpaid']
    },
    accountcharges: Number,
    accountType: {
        type: String,
        required: true,
        default: 'Lite',
        enum: ['Lite', 'Pro']
    },
    upgradefeeStatus: {
        type: String,
        required: true,
        default: 'Unpaid',
        enum: ['Paid', 'Pending', 'Unpaid']
    },
    upgradefee: Number,
    // taxfeeStatus: {
    //     type: String,
    //     required: true,
    //     default: 'Unpaid',
    //     enum: ['Paid', 'Pending', 'Unpaid']
    // },
    // taxfee: Number
})

userSchema.plugin(passportLocalMongoose);

// userSchema.post('findOneAndDelete', async function(doc) {
//     if(doc){
//         await Review.deleteMany({
//             _id: {
//                 $in: doc.reviews
//             }
//         })
//     }
// })

module.exports = mongoose.model('Users', userSchema);