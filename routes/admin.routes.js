const express = require('express');
const router = express.Router();
const { openAdminDashboard, adminLogin, displayRecruiterList, filterRecruiterList, updateBlocking, deleteRecruiter, getApplicantList, getFilteredApplicantList, applicantBlocking, openEditRecruiter, getRecruiterData, updateRecruiterDetails, openApplicantDetailsPage, getApplicantData, deleteApplicant, updateApplicantDetails, adminLogout } = require('../controllers/admin.controller');

router.get('/', openAdminDashboard);

router.get('/login', (req, res) => {
    res.render('admin/admin_login_form', { errorMsg: null });
});

router.post('/login', adminLogin);

router.get('/recruiterList', displayRecruiterList);


router.post('/filterRecruiter', filterRecruiterList);

// route
router.get('/takeAction', updateBlocking);

// route to delete the recruiter id
router.get('/deleteRecruiter', deleteRecruiter);


// route to open the admin applicant page
router.get('/applicant_page', (req, res) => {
    res.render('admin/admin_applicant_page', { profilePic: req.session.profilePic, username: req.session.username, toastNotification: null })
});

// route to send applicant data to the admin applicant page
router.get('/applicantList', getApplicantList);

// route to send filterd applicant data to the admin applicant page
router.post('/filterApplicant', getFilteredApplicantList);

// route to activate or deactivate applicant id
router.get('/takeActionApplicant', applicantBlocking);


// route to open the edit recruiter details page
router.get('/editRecruiter', openEditRecruiter);


// route to send data to frontend to the recruiter details page
router.get('/getRecruiterData', getRecruiterData);


// route to update the recruiter details 
router.post('/updateRecruiterDetails', updateRecruiterDetails);


// route to open the applicant details page to edit
router.get('/applicantDetails', openApplicantDetailsPage);


// route to send data to frontend for the admin applicant details page
router.get('/getApplicantData', getApplicantData);


router.post('/updateApplicantDetails', updateApplicantDetails);


router.get('/deleteApplicant', deleteApplicant);



// logout route
router.get('/logout', adminLogout);

module.exports = router;