if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
                            
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const ejsMate = require('ejs-mate');
const webpages = require('./routes/webpages');
const user = require('./routes/user');
const admin = require('./routes/admin');
const paymentRoute = require('./routes/payment');
const investmentRoute = require('./routes/investmentRoute');
const acctActivation = require('./routes/acctActivation');
const Users = require('./models/users');
const passwordReset = require("./routes/passwordReset");
const Investment = require('./models/investment');
const Depositmethods = require('./models/depositmethod');
const InvestmentPlans = require('./models/investmentplans');
const Reviews = require('./models/reviews');
const Referral = require('./models/referral');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
// const dbUrl = 'mongodb://localhost:27017/mining4';
const dbUrl = process.env.DB_URL;
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const MongoStore = require('connect-mongo');


// mongodb database setup starts
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true})

const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error:"));
    db.once("open", () => {
        console.log("Database connected")
    })

// mongodb database setup ends

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'));
app.use(methodOverride('_method'));


app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(express.static(path.join(__dirname, 'public')));


const secret = process.env.SECRET ||  'thisshouldbeabettersecret';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24  * 60 * 60
});

store.on("error", function(e){
    console.log("SESSION STORE ERROR", e)
})

// passport configuration start
const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());

app.use((req, res, next) => {
    // console.log(req.query)
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    res.locals.websiteLink = 'kygopool.ga'
    res.locals.websiteSupportMail = 'support@kygopool.ga';
    next();
})

app.use(passport.initialize());
app.use(passport.session());

// passport.use(new LocalStrategy(Users.authenticate()));
// passport.serializeUser(Users.serializeUser());
// passport.deserializeUser(Users.deserializeUser());

passport.use(
    new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
      Users.findOne({ email: email }).then(user => {
        if (!user) {
          return done(null, false, {
            message: "Invalid login email/ password."
          });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, {
              message: "Invalid login password."
            });
          }
        });
      });
    })
  );

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
      Users.findById(id, function(err, user) {
      done(null, user);
    });
  });

   

// passport configuration ends

app.get('/', async(req, res) => {
    const investmentplans = await InvestmentPlans.find({});
    // const reviews = await Reviews.find({status: 'Verified'});
    res.render("home", {investmentplans})
})

// app.get('/home', async(req, res) => {
//     const investmentplans = await InvestmentPlans.find({});
//     const reviews = await Reviews.find({status: 'Verified'});
//     res.render("home", {investmentplans, reviews})
// })

app.use('/', webpages)
app.use('/', user)
app.use('/', admin)
app.use('/', passwordReset)
app.use('/', paymentRoute)
app.use('/', investmentRoute)
app.use('/', acctActivation)

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log(`Serving on port ${port}`)
});

module.exports = app;
