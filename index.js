require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');

// import routes files
const applicantAuthenRoutes = require('./routes/applicantAuthen.routes');
const applicantOperations = require('./routes/applicantOperations.routes');
const applicantProfileRoute = require('./routes/applicantProfile.routes');
const recruiterAuth = require('./routes/recruiterAuthen.routes');
const recruiterOperations = require('./routes/recruiterOperations.routes')
const adminRoutes = require('./routes/admin.routes');

var sessionOption = {
    secret: '&&#(@@^%$)',
    resave: true,
    saveUninitialized: false,
    cookie:{
        secure: false,
        maxAge: 600000,
        httpOnly: true,  // max false in production
        sameSite: 'lax'
    },
    unset: 'destroy',
    name: 'sessionId',
    exposedHeaders: ['Set-Cookie']
};

var PORT = process.env.PORT || 3000;

// middleware setup for handling form data
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// setup session
app.use(session(sessionOption));

// setup static files  /views/
app.use('/function', express.static(path.join(__dirname, 'function')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// setup viewing engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// db connection
var conn = require('./database/dbConnect')

// routes middleware
app.use('/jobSeeker', applicantAuthenRoutes);
app.use('/jobSeeker', applicantOperations);
app.use('/jobSeeker', applicantProfileRoute);

app.use('/jobCreator', recruiterAuth);
app.use('/jobCreator', recruiterOperations);

app.use('/admin', adminRoutes);


app.get('/config', (req, res) => {
    res.json({ API_BASE_URL: process.env.API_BASE_URL });
});


// inital route
app.get('/', (req, res)=>{
    res.sendFile(path.join(__dirname, 'views', 'applicant', 'openningPage.html'));
});

app.get('/home', (req, res)=>{
    popularJobsQuery = `SELECT jd.* FROM job_details jd
                          JOIN (
                                SELECT job_id, COUNT(application_id) AS application_count
                                FROM job_applications
                                GROUP BY job_id
                                ORDER BY application_count DESC                                    LIMIT 6
                           ) top_jobs ON jd.job_id = top_jobs.job_id;`
    conn.query(popularJobsQuery, (err, result)=>{
        if(err){
            console.log(err);
            return;
        }

        res.render('applicant/applicant_homepage', { r2: result, isLogged: req.session.loggedIn, toastNotification: null });
    })
})


app.listen(PORT, ()=>{
    console.log(`App is listening to port ${PORT} ✅`);
});

