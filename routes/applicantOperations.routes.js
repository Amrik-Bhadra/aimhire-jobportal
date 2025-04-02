const express = require('express');
const router = express.Router();
const { applicantHomePage, displayJobs, filterJobs, jobDetails, applyForJob, applicantDashboard, openDashboard, editProfile, deleteNotification, deleteProfilePic, uploadProfilePic } = require('../controllers/applicant.controller');
const upload = require('../function/uploadSetup.js');
const dbgetter = require('../database/dbGetter.js');

// home page route 
router.get('/', applicantHomePage);

// job list route
router.get('/jobList', displayJobs);

// jobs route - to fetch job details
router.get('/jobs', (req, res) => {
    dbgetter.dbgetData(req, res, 'select * from job_details')
});


// job filter route
router.post('/filters', filterJobs);

// job details route 
router.get('/jobDetails', jobDetails);


router.get('/applyJob', applyForJob);



router.get('/dashboard', applicantDashboard);


router.get('/applicant-dashboard', openDashboard);

router.get('/editprofile', editProfile);



// delete notificaton
router.get('/deleteNotification', deleteNotification);



// delete profile pic route
router.get('/deleteProfilePic', deleteProfilePic)



router.post('/uploadProfile', upload.single('prof-pdf'), uploadProfilePic);



module.exports = router;