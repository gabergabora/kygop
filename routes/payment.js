//NPM Dependencies//
const express = require('express');
const router = express.Router();
const Users = require('../models/users');
const Transaction = require('../models/transaction');
const Investment = require('../models/investment');
const Depositmethods = require('../models/depositmethod');
const passport = require('passport');
const sendEmail = require("../utils/sendEmail");
const multer  = require('multer');
const { storage, cloudinary } = require('../cloudinary');
const upload = multer({ storage });
//End of NPM Dependencies//


//Javascript Time and Date Setup//
// const today = new Date();
// const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
// const hours = today.getHours() > 12 ? today.getHours() - 12 : today.getHours();
// const time = hours + ":" + today.getMinutes() + ":" + today.getSeconds();
// const ampm = today.getHours() >= 12 ? 'PM' : 'AM';
// const dateTime = date+' '+time+ ' ' + ampm;
//End of Javascript Time and Date Setup//

//Middlewares//
const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login')
    }
    next();
}

const isClient = async(req, res, next) => {
    const { username, password } = req.body;
    const user = await Users.findOne({username});
    if (!user) {
        req.flash('error', 'Incorrect Username or Password!')
        return res.redirect('/login');
    } else if (user.role !== 'client') {
        req.flash('error', 'You do not have permission to access this route!')
        return res.redirect('/login')
    } 
    next();
}

const onlyClient = async(req, res, next) => {
    const id = req.user.id;
    const user = await Users.findById(id);
    if (user.role !== 'client') {
        req.flash('error', 'You do not have permission to access this route!')
        return res.redirect('/')
    } 
    next();
}

const paidAcctCharges = async(req, res, next) => {
    const id = req.user.id;
    const user = await Users.findById(id);
    if (user.accountchargesStatus === 'Unpaid') {
        req.flash('error', 'You are yet to pay the service charge!')
        return res.redirect('/user/service-charge-payment')
    } 
    next();
}
//End of Middlewares//



router.get('/user/service-charge-payment', isLoggedIn,  onlyClient, async(req, res) => {
    const user = await Users.findById(req.user.id);
    const deposits = await Transaction.find({validateUser: user, transactionType: 'Payment'});
    const depositmethods  = await Depositmethods.find({});
    console.log(user);
    const accountbalance = parseInt(user.wallet);
    const charges = (accountbalance / 100) * 20;
    res.render('user/servicechargepayment', {user, depositmethods, deposits, charges });
});

router.post('/user/service-charge-payment', isLoggedIn, onlyClient, async(req, res) => {
    const id  = req.user.id;
    const user = await Users.findById(id);
        const today = new Date();
        const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        const hours = today.getHours() > 12 ? today.getHours() - 12 : today.getHours();
        const time = hours + ":" + today.getMinutes() + ":" + today.getSeconds();
        const ampm = today.getHours() >= 12 ? 'PM' : 'AM';
        const dateTime = date+' '+time+ ' ' + ampm;
    const {transactionmethod, narration, amount} = req.body;
    const accountbalance = parseInt(user.wallet);
    const charges = (accountbalance / 100) * 20;
    const deposit = new Transaction({transactionmethod, narration, amount: charges, transactiondate: dateTime, transactionType: 'Payment', validateUser: user});
    user.transaction.push(deposit);
    await deposit.save();
    await user.save()
    console.log(deposit);
    res.redirect(`/user/payment/${deposit.id}`);
});

router.get('/user/payment/:id', isLoggedIn,  onlyClient, async(req, res) => {
    const user = await Users.findById(req.user.id);
    const deposit = await Transaction.findById(req.params.id);
    const depositmethod  = await Depositmethods.findOne({depositmethodname: `${deposit.transactionmethod}`});
    res.render('user/payment2', {user, deposit, depositmethod});
});

router.put('/user/payment/:id', isLoggedIn, onlyClient,  upload.array('depositproof'), async (req, res) => {
    const id = req.params.id; 
    const {transactionproof } = req.body;
    const deposit = await Transaction.findByIdAndUpdate(id, {transactionproof}, { runValidators: true, new: true })
    deposit.transactionproof =  req.files.map(f => ({url: f.path, filename: f.filename}))
    await deposit.save();
    console.log(deposit);
    req.flash('success', 'Please hold on while we verify your payment, an email will be sent to you shortly!!')
    res.redirect('/user/service-charge-payment')
});



router.get('/user/account-upgrade', isLoggedIn,  onlyClient, async(req, res) => {
    const user = await Users.findById(req.user.id);
    const deposits = await Transaction.find({validateUser: user, transactionType: 'Payment'});
    const depositmethods  = await Depositmethods.find({});
    res.render('user/acctupgrade2', {user, depositmethods, deposits });
});

router.get('/user/upgrade-account', isLoggedIn,  onlyClient, async(req, res) => {
    const user = await Users.findById(req.user.id);
    const deposits = await Transaction.find({validateUser: user, transactionType: 'Payment'});
    const depositmethods  = await Depositmethods.find({});
    res.render('user/acctupgrade', {user, depositmethods, deposits });
});

router.post('/user/account-upgrade', isLoggedIn, onlyClient, async(req, res) => {
    const id  = req.user.id;
    const user = await Users.findById(id);
        const today = new Date();
        const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        const hours = today.getHours() > 12 ? today.getHours() - 12 : today.getHours();
        const time = hours + ":" + today.getMinutes() + ":" + today.getSeconds();
        const ampm = today.getHours() >= 12 ? 'PM' : 'AM';
        const dateTime = date+' '+time+ ' ' + ampm;
    const {transactionmethod, narration, amount} = req.body;
    const deposit = new Transaction({transactionmethod, narration, amount, transactiondate: dateTime, transactionType: 'Payment', validateUser: user});
    user.transaction.push(deposit);
    await deposit.save();
    await user.save()
    console.log(deposit);
    res.redirect(`/user/payment/${deposit.id}`);
});


module.exports = router;