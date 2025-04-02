const express = require('express');
const router = express.Router();
const upload = require('../function/uploadSetup');
const { profileComplete, updateProfile } = require('../controllers/applicant.controller');

router.post('/profileComplete', upload.single('prof-image'), profileComplete);


router.post('/updateProfile', upload.fields([{ name: 'prof-image', maxCount: 1 }, { name: 'prof-pdf', maxCount: 1 }]), updateProfile);


module.exports = router;