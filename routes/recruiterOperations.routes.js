const express = require('express');
const { recruiterDashboard, openRecruiterDashboard, getChartsData, openJobApplicationPage, showAllApplications, showFilteredApplications, viewApplicantDetails, applicantDetails, saveUnsaveApplications, savedApplications, getSavedApplicationData, filteredSavedData, unsaveApplication, deleteApplication, showCreatedJobs, viewJobDetails, deleteCreatedJobs, openNewJobForm, createNewJob } = require('../controllers/recruiter.controller');
const router = express.Router();


// route to homepage of the recruiter - dashboard
router.get('/', recruiterDashboard);


router.get('/dashboard', openRecruiterDashboard);

router.get('/charts', getChartsData);


// open job application page

router.get('/jobApplications', openJobApplicationPage);


// route for all applications
router.get('/applications', showAllApplications);


router.post('/filteredApplications', showFilteredApplications);


// view more details of applicant - route
router.get('/applicantDetails', viewApplicantDetails);

router.post('/applicantDetails', applicantDetails)


// save or unsave application
router.get('/saveUnsaveTheApplication', saveUnsaveApplications);



// open saved application
router.get('/savedApplications', savedApplications)

// all saved application data send to frontend
router.get('/allSavedApplications', getSavedApplicationData);


// filtered saved application data send to front end
router.post('/filteredApplications', filteredSavedData);

// unsave the application
router.get('/unsaveTheApplicationFromSaved', unsaveApplication);


// delete application routes
router.get('/deleteApplication', deleteApplication);



// display all created jobs
router.get('/jobList', showCreatedJobs);

// delete job
router.get('/removeJob', deleteCreatedJobs);

// view details of a created job
router.get('/viewDetails', viewJobDetails);



router.get('/addJob', openNewJobForm);


router.post('/addJob', createNewJob);


module.exports = router;