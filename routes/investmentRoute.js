//NPM Dependencies//
const express = require('express');
const router = express.Router();
const Users = require('../models/users');
const Investment = require('../models/investment');
const Depositmethods = require('../models/depositmethod');
const InvestmentPlans = require('../models/investmentplans');
const passport = require('passport');
const {sendEmail, welcomeMail, emailActMail, passwordResetMail, verifyMail, acctVerifiedMail, depositMail, openInvestmentMail, endInvestmentMail} = require("../utils/sendEmail");
const nodemailer = require("nodemailer");
const fs = require("fs");
const ejs = require("ejs");
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
        req.flash('error', 'You are yet to pay your investment service charge!')
        return res.redirect('/user/service-charge-payment')
    } 
    next();
}

const paidUpgradeFee = async(req, res, next) => {
    const id = req.user.id;
    const user = await Users.findById(id);
    if (user.upgradefeeStatus === 'Unpaid') {
        req.flash('error', 'You need to upgrade your account in order to withdraw funds!')
        return res.redirect('/user/account-upgrade')
    } 
    next();
}

const validateWithdrawal = async(req, res, next) => {
    const id = req.user.id;
    const user = await Users.findById(id).populate('investment');
    if (user.investment.length === 0) {
        req.flash('error', 'You need to make a minimum of 1 investment to be qualified for withdrawals!')
        return res.redirect('/dashboard/crypto-mining')
    } 
    next();
}
//End of Middlewares//

// router.get('/dashboard/forex', isLoggedIn,  onlyClient, async(req, res) => {
//     const user = await Users.findById(req.user.id).populate({path: 'investment', options: { sort: { 'investmentdate': -1 } } })
//     // const investments = await Investment.find({status: 'Pending'});
//     res.render('user/investment', {user});
// });

// router.get('/dashboard/stocks', isLoggedIn,  onlyClient, async(req, res) => {
//     const user = await Users.findById(req.user.id).populate({path: 'investment', options: { sort: { 'investmentdate': -1 } } })
//     // const investments = await Investment.find({status: 'Pending'});
//     res.render('user/stocks', {user});
// });

router.get('/dashboard/crypto-mining', isLoggedIn,  onlyClient, async(req, res) => {
    const user = await Users.findById(req.user.id).populate({path: 'investment', options: { sort: { 'investmentdate': -1 } } })
    const depositmethods  = await Depositmethods.find({});
    // const investments = await Investment.find({status: 'Pending'});
    res.render('user/cryptomining', {user, depositmethods});
});

// router.get('/dashboard/newinvestment', isLoggedIn,  onlyClient, async(req, res) => {
//     const user = await Users.findById(req.user.id);
//     const investmentplans = await InvestmentPlans.find({}).sort({minimumamount: 1});
//     res.render('user/investmentpackages', {user, investmentplans});
// });

// router.post('/dashboard/newinvestment/:id', isLoggedIn, onlyClient, async(req, res) => {
//     const user = await Users.findById(req.user.id);
//     const investmentplan = await InvestmentPlans.findById(req.params.id);
//     const today = new Date();
//     const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
//     const hours = today.getHours() > 12 ? today.getHours() - 12 : today.getHours();
//     const time = hours + ":" + today.getMinutes() + ":" + today.getSeconds();
//     const ampm = today.getHours() >= 12 ? 'PM' : 'AM';
//     const dateTime = date+' '+time+ ' ' + ampm;
//     const {investedamount} = req.body;
//     const investment = new Investment({investedamount, investmentdate: dateTime, packagetype: investmentplan.packagename,
//          minimumamount: investmentplan.minimumamount, maximumamount: investmentplan.maximumamount, duration: investmentplan.duration,
//           profitpercentage: investmentplan.profitpercentage, charges: investmentplan.charges, status: 'Active', investmentprofit: 0.00, investmentType: 'Forex' });
//     if (investedamount <= user.wallet) {
//         if (investedamount >= investmentplan.minimumamount && investedamount <= investmentplan.maximumamount) {
//             user.investment.push(investment);
//             await investment.save();
//             await user.save()
//             await user.updateOne({wallet: user.wallet - investment.investedamount}, { runValidators: true, new: true });
//             const subject = 'INVESTMENT';
//             const text = `Hello ${user.username}!  
//              \n You successfully started an investment. 
//              \n Investment Plan: ${investment.packagetype}, 
//              \n Amount Invested: $${investment.investedamount}.
//              \n Thanks for choosing us!`
//             await sendEmail(user.email, subject, text);
//             req.flash('success', 'Investment Activated')
//             res.redirect(`/dashboard/investment/${investment.id}`);
//         } else {
//             req.flash('error', `Investment amount needs to be above $${investmentplan.minimumamount.toLocaleString()} and below $${investmentplan.maximumamount.toLocaleString()}`);
//             res.redirect('/dashboard/newinvestment');
//         }
//     } else {
//         req.flash('error', 'Insufficient wallet balance');
//         res.redirect('/dashboard/newinvestment');
//     } 
// });

// router.get('/dashboard/new-stock-investment', isLoggedIn,  onlyClient, async(req, res) => {
//     const user = await Users.findById(req.user.id);
//     const investmentplans = await InvestmentPlans.find({}).sort({minimumamount: 1});
//     res.render('user/stockplans', {user, investmentplans});
// });

// router.post('/dashboard/new-stock-investment/:id', isLoggedIn, onlyClient, async(req, res) => {
//     const user = await Users.findById(req.user.id);
//     const investmentplan = await InvestmentPlans.findById(req.params.id);
//     const today = new Date();
//     const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
//     const hours = today.getHours() > 12 ? today.getHours() - 12 : today.getHours();
//     const time = hours + ":" + today.getMinutes() + ":" + today.getSeconds();
//     const ampm = today.getHours() >= 12 ? 'PM' : 'AM';
//     const dateTime = date+' '+time+ ' ' + ampm;
//     const {investedamount} = req.body;
//     const investment = new Investment({investedamount, investmentdate: dateTime, packagetype: investmentplan.packagename,
//          minimumamount: investmentplan.minimumamount, maximumamount: investmentplan.maximumamount, duration: investmentplan.duration,
//           profitpercentage: investmentplan.profitpercentage, charges: investmentplan.charges, status: 'Active', investmentprofit: 0.00, investmentType: 'Stocks' });
//     if (investedamount <= user.wallet) {
//         if (investedamount >= investmentplan.minimumamount && investedamount <= investmentplan.maximumamount) {
//             user.investment.push(investment);
//             await investment.save();
//             await user.save()
//             await user.updateOne({wallet: user.wallet - investment.investedamount}, { runValidators: true, new: true });
//             const subject = 'INVESTMENT';
//             const text = `Hello ${user.username}!  
//              \n You successfully started an investment. 
//              \n Investment Plan: ${investment.packagetype}, 
//              \n Amount Invested: $${investment.investedamount}.
//              \n Thanks for choosing us!`
//             await sendEmail(user.email, subject, text);
//             req.flash('success', 'Investment Activated')
//             res.redirect(`/dashboard/investment/${investment.id}`);
//         } else {
//             req.flash('error', `Investment amount needs to be above $${investmentplan.minimumamount.toLocaleString()} and below $${investmentplan.maximumamount.toLocaleString()}`);
//             res.redirect('/dashboard/newinvestment');
//         }
//     } else {
//         req.flash('error', 'Insufficient wallet balance');
//         res.redirect('/dashboard/new-stock-investment');
//     } 
// });

router.get('/dashboard/new-crypto-mining-investment', isLoggedIn,  onlyClient, async(req, res) => {
    const user = await Users.findById(req.user.id);
    const investmentplans = await InvestmentPlans.find({}).sort({minimumamount: 1});
    const depositmethods  = await Depositmethods.find({});
    res.render('user/cryptoplans', {user, investmentplans, depositmethods});
});

router.post('/dashboard/new-crypto-mining-investment/:id', isLoggedIn, onlyClient, async(req, res) => {
    const user = await Users.findById(req.user.id);
    const investmentplan = await InvestmentPlans.findById(req.params.id);
    const today = new Date();
    const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    const hours = today.getHours() > 12 ? today.getHours() - 12 : today.getHours();
    const time = hours + ":" + today.getMinutes() + ":" + today.getSeconds();
    const ampm = today.getHours() >= 12 ? 'PM' : 'AM';
    const dateTime = date+' '+time+ ' ' + ampm;
    const {investedamount, cryptocurrency } = req.body;
    const investment = new Investment({investedamount, cryptocurrency, investmentdate: dateTime, packagetype: investmentplan.packagename,
         minimumamount: investmentplan.minimumamount, maximumamount: investmentplan.maximumamount, duration: investmentplan.duration,
          profitpercentage: investmentplan.profitpercentage, charges: investmentplan.charges, status: 'Active', investmentprofit: 0.00, investmentType: 'Crypto Mining', power: investmentplan.power, storage: investmentplan.storage });
    if (investedamount <= user.wallet) {
        if (investedamount >= investmentplan.minimumamount && investedamount <= investmentplan.maximumamount) {
            user.investment.push(investment);
            await investment.save();
            await user.save()
            await user.updateOne({wallet: user.wallet - investment.investedamount}, { runValidators: true, new: true });
            const subject = 'INVESTMENT ACTIVATED';
            await openInvestmentMail(user.email, subject, user.username, investment.packagetype, investment.investedamount);
            req.flash('success', 'Investment Activated')
            res.redirect(`/dashboard/investment/${investment.id}`);
        } else {
            req.flash('error', `Investment amount needs to be above $${investmentplan.minimumamount.toLocaleString()} and below $${investmentplan.maximumamount.toLocaleString()}`);
            res.redirect('/dashboard/newinvestment');
        }
    } else {
        req.flash('error', 'Insufficient wallet balance');
        res.redirect('/dashboard/new-crypto-mining-investment');
    } 
});

router.get('/dashboard/investment/:id', isLoggedIn,  onlyClient, async(req, res) => {
    const user = await Users.findById(req.user.id);
    const investment = await Investment.findById(req.params.id);
    const totalincome = parseInt(investment.investedamount) + parseInt(investment.investmentprofit);
    res.render('user/investment-show', {user, investment, totalincome});
});

router.put('/dashboard/investment/:id', isLoggedIn, onlyClient, async (req, res) => {
    const id = req.params.id; 
    const user = await Users.findById(req.user.id);
    const investment = await Investment.findById(id);
    const {newfund} = req.body;
    const fund = parseInt(newfund)
    await investment.updateOne({investedamount: investment.investedamount + fund}, { runValidators: true, new: true });
    await user.updateOne({wallet: user.wallet - fund}, { runValidators: true, new: true });
    req.flash('success', `Successfully added ${fund} USD to investment.`)
    res.redirect(`/dashboard/investment/${investment.id}`)
});

router.put('/dashboard/investment/:id/endinvestment', isLoggedIn, onlyClient, async (req, res) => {
    const id = req.params.id; 
    const user = await Users.findById(req.user.id);
    const investment = await Investment.findById(id);
    const totalprofit = parseInt(investment.investedamount) + parseInt(investment.investmentprofit);
    // Remove charges from account
    // const investedamount = parseInt(investment.investedamount);
    // const profits = parseInt(investment.investmentprofit)
    // const totalfund = investedamount + profits;

    // const percent = parseInt(investment.charges);
    // const percentage = (profits / 100) * percent;
    // const finalpercent = totalfund - percentage

    // await user.updateOne({wallet: user.wallet + finalpercent}, { runValidators: true, new: true });

    await user.updateOne({wallet: user.wallet + totalprofit}, { runValidators: true, new: true });
    await investment.updateOne({status: 'Completed'}, { runValidators: true, new: true });
    const subject = 'INVESTMENT COMPLETED';
    await endInvestmentMail(user.email, subject, user.username, investment.packagetype, investment.investedamount, investment.investmentprofit);
    req.flash('success', `Successfully ended current investment.`)
    res.redirect(`/dashboard/investment/${investment.id}`)
});

module.exports = router;