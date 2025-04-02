var conn = require('../database/dbConnect.js');
const mailFunc = require('../function/mailSetup.js');

const recruiterDashboard = (req, res) => {
    if (!req.session.loggedIn) {
        res.redirect('/jobCreator/login');
    } else {
        const creatorId = req.session.creator_id;
        const query = `SELECT * FROM job_creator WHERE creator_id = ${creatorId}`;

        conn.query(query, (err, result) => {
            if (err) {
                console.log(err);
                return;
            }

            res.redirect('/jobCreator/dashboard?toastNotification=Logged In Successfully!!');

        });
    }
};


const openRecruiterDashboard = (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/jobCreator/login');
    }
    const creatorId = req.session.creator_id;
    const query1 = `SELECT jd.creator_id,
                        COUNT(ja.application_id) AS total_applications,
                        COUNT(CASE WHEN ja.application_status = 'Pending' THEN 1 END) AS pending_applications,
                        COUNT(CASE WHEN ja.application_status = 'Selected for interview' THEN 1 END) AS interview_scheduled_applications
                    FROM 
                        job_applications ja
                    JOIN 
                        job_details jd ON ja.job_id = jd.job_id
                    WHERE 
                        jd.creator_id = ?
                    GROUP BY 
                        jd.creator_id`;

    conn.query(query1, [creatorId], (err, result1) => {
        if (err) {
            console.log(err);
            return;
        }
        else {
            let totalApplications, pendingApplications, interviewScheduled;
            if (result1.length > 0) {
                totalApplications = result1[0].total_applications;
                pendingApplications = result1[0].pending_applications;
                interviewScheduled = result1[0].interview_scheduled_applications;
            }
            else {
                totalApplications = 0;
                pendingApplications = 0;
                interviewScheduled = 0;
            }
            res.render('recruiter/dashboard', {
                profilePic: req.session.profilePic, username: req.session.creator_username,
                totalApplications: totalApplications, pendingApplications: pendingApplications, interviewScheduled: interviewScheduled, toastNotification: req.query.toastNotification
            });
        }
    });
};


const getChartsData = (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/jobCreator/login');
    }
    const creatorId = req.session.creator_id;
    const query = `select job_role, count(applicant_id) as no_of_app from job_applications as ja join job_details as 
    jd on ja.job_id = jd.job_id where creator_id = ? group by jd.job_role`;
    conn.query(query, [creatorId], (err, result) => {
        if (err) {
            console.log(err);
            return;
        }
        else {
            const jobRole = result.map(result1 => result1.job_role);
            const count = result.map(result2 => result2.no_of_app);
            const chartData = { jobRole, count };
            res.json(chartData);
        }
    })
};

const openJobApplicationPage = (req, res) => {
    if (!req.session.loggedIn) {
        res.redirect('/jobCreator/login');
    } else {
        res.render('recruiter/applications', { profilePic: req.session.profilePic, isLogged: req.session.loggedIn, username: req.session.creator_username, toastNotification: req.query.toastNotification });
    }
};

const showAllApplications = (req, res) => {
    if (!req.session.loggedIn) {
        res.redirect('/jobCreator/login');
    } else {
        // const cid = 1;
        const cid = req.session.creator_id;
        const query = `SELECT DISTINCT ja.*, jd.job_role, japp.application_id, japp.isSaved 
        FROM job_applicant ja
        JOIN job_applications japp ON ja.applicant_id = japp.applicant_id
        JOIN job_details jd ON japp.job_id = jd.job_id
        JOIN job_creator jc ON jd.creator_id = jc.creator_id
        WHERE jc.creator_id = ?`;

        const data = {};

        conn.query(query, [cid], (err, result) => {
            if (err) {
                console.log(err);
                return;
            } else {

                data.rows = result;
                // console.log(data.rows);
                res.json(data);
            }
        });
    }
};

const showFilteredApplications = (req, res) => {

    const jobRole = req.body.job_role;
    console.log('Jobe role is : ' + jobRole);

    if (jobRole === '') {
        res.redirect('/jobCreator/applications');
    } else {
        const query = `SELECT DISTINCT ja.*, jd.job_role,japp.application_id, japp.isSaved
        FROM job_applicant ja
        JOIN job_applications japp ON ja.applicant_id = japp.applicant_id
        JOIN job_details jd ON japp.job_id = jd.job_id
        JOIN job_creator jc ON jd.creator_id = jc.creator_id
        WHERE jc.creator_id = ? AND jd.job_role = ?;`;

        // console.log(req.session.creator_id);
        const data = {};

        conn.query(query, [req.session.creator_id, jobRole], (err, result) => {
            if (err) {
                console.log(err);
                return;
            } else {
                data.rows = result;
                // console.log(data.rows);
                res.json(data);
            }
        });
    }

};

const viewApplicantDetails = (req, res) => {
    const applicantID = req.query.applicant_id;
    const job_role = req.query.job_role;
    const application_id = req.query.application_id;
    if (!req.session.loggedIn) {
        return res.redirect('/jobCreator/login');
    }
    const creatorId = req.session.creator_id;
    const query1 = `SELECT profile_photo, creator_fname, creator_lname FROM job_creator WHERE creator_id = ?`;

    conn.query(query1, [creatorId], (err1, result1) => {
        if (err1) {
            console.log(err1);
            return;
        }

        if (result1.length > 0) {
            const profilePic = result1[0].profile_photo;
            const username = result1[0].creator_fname + ' ' + result1[0].creator_lname;
            const query = `SELECT * FROM job_applicant WHERE applicant_id = ${applicantID}`;
            conn.query(query, (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Internal Server Error');
                }
                if (result.length > 0) {
                    console.log(result[0].exp_level)
                    res.render('recruiter/profileDetails', { applicant: result[0], jobRole: job_role, profilePic: profilePic, username: username, application_id: application_id });
                } else {
                    res.status(404).send('Applicant not found');
                }
            });
        }
        else {
            res.status(404).send('Creator not found');
        }
    });
};


const applicantDetails = (req, res) => {
    const applicationID = req.body.application_id;
    console.log("mera application id: " + applicationID);
    const status = req.body.status;
    const query = `update job_applications set application_status = "${status}" where application_id = ${applicationID} and isViewed = 1`;
    conn.query(query, async (err, result) => {
        if (err) {
            console.error(err);
        }
        else {
            const applicant_id = req.body.applicant_id;
            const query1 = `SELECT ja.email_id, jd.job_role, japp.application_status, jd.company FROM job_applications japp JOIN job_applicant ja ON japp.applicant_id = ja.applicant_id JOIN job_details jd ON japp.job_id = jd.job_id WHERE ja.applicant_id = ?`;

            conn.query(query1, [applicant_id], async (err, result1) => {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    try {
                        const mailResult = await mailFunc.statusMailFunc(result1[0].email_id, status, result1[0].job_role, result1[0].company);
                        if (mailResult.success) {
                            res.redirect('/jobCreator/jobApplications');
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }
            });
        }
    })
};


const saveUnsaveApplications = (req, res) => {
    if (!req.session.loggedIn) {
        res.redirect('/jobCreator/login');
    } else {
        const saveVal = req.query.isSaved;
        const applicationID = req.query.application_id;
        let value = [];

        if (saveVal == 0) {
            value = [1, applicationID];
        } else {
            value = [0, applicationID];
        }

        const query = "UPDATE job_applications SET isSaved = ? WHERE application_id = ?";
        conn.query(query, value, (err, result) => {
            if (err) {
                console.log(err);
                return;
            } else {
                res.redirect('/jobCreator/jobApplications');
            }
        });
    }
};


const savedApplications = (req, res) => {
    res.render('recruiter/saved_applications', { profilePic: req.session.profilePic, username: req.session.creator_username, toastNotification: req.query.toastNotification });
};


const getSavedApplicationData = (req, res) => {
    const cid = req.session.creator_id;
    const query = `SELECT DISTINCT ja.*, jd.job_role, japp.application_id, japp.isSaved 
    FROM job_applicant ja
    JOIN job_applications japp ON ja.applicant_id = japp.applicant_id
    JOIN job_details jd ON japp.job_id = jd.job_id
    JOIN job_creator jc ON jd.creator_id = jc.creator_id
    WHERE jc.creator_id = ? and japp.isSaved = 1`;

    const data = {};

    conn.query(query, [cid], (err, result) => {
        if (err) {
            console.log(err);
            return;
        } else {
            data.rows = result;
            res.json(data);
        }
    });
};


const filteredSavedData = (req, res) => {

    const jobRole = req.body.job_role;
    console.log('Jobe role is : ' + jobRole);

    if (jobRole === '') {
        res.redirect('/jobCreator/applications');
    } else {
        const query = `SELECT DISTINCT(ja.*), jd.job_role,japp.application_id, japp.isSaved
    FROM job_applicant ja
    JOIN job_applications japp ON ja.applicant_id = japp.applicant_id
    JOIN job_details jd ON japp.job_id = jd.job_id
    JOIN job_creator jc ON jd.creator_id = jc.creator_id
    WHERE jc.creator_id = ? AND jd.job_role = ? AND japp.isSaved = 1;`;

        // console.log(req.session.creator_id);
        const data = {};

        conn.query(query, [req.session.creator_id, jobRole], (err, result) => {
            if (err) {
                console.log(err);
                return;
            } else {
                data.rows = result;
                // console.log(data.rows);
                res.json(data);
            }
        });
    }

};

const unsaveApplication = (req, res) => {
    const saveVal = req.query.isSaved;
    const applicationID = req.query.application_id;

    const query = "UPDATE job_applications SET isSaved = ? WHERE application_id = ?";
    conn.query(query, [0, applicationID], (err, result) => {
        if (err) {
            console.log(err);
            return;
        } else {
            res.redirect('/jobCreator/savedApplications');
        }
    });
};

const deleteApplication = (req, res) => {
    const applicationID = req.query.application_id;
    const source = req.query.from;
    const query1 = 'SELECT jd.job_role, jd.company, ja.email_id FROM job_applications japp JOIN job_applicant ja ON japp.applicant_id = ja.applicant_id JOIN job_details jd ON japp.job_id = jd.job_id WHERE application_id = ?';

    conn.query(query1, [applicationID], async (err, result) => {
        if (err) {
            console.log(err);
            return;
        } else {

            try {
                const mailResult = await mailFunc.statusMailFunc(result[0].email_id, "Rejected", result[0].job_role, result[0].company);

                if (mailResult.success) {
                    const query = "DELETE FROM job_applications WHERE application_id = ?";
                    conn.query(query, [applicationID], (err, result1) => {
                        if (err) {
                            console.log(err);
                            return;
                        } else {
                            if (source === 'all_application') {
                                res.redirect('/jobCreator/jobApplications?toastNotification=Deleted Successfully');
                            } else {
                                res.redirect('/jobCreator/savedApplications?toastNotification=Deleted Successfully');
                            }
                        }
                    });
                }
            } catch (error) {
                console.log(error);
                res.send(error);
            }

        }
    });
};

const showCreatedJobs = (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/jobCreator/login');
    }

    const creator_id = req.session.creator_id;

    const query = `SELECT * FROM job_details WHERE creator_id = ?`;
    conn.query(query, [creator_id], (err, result) => {
        if (err) {
            console.error(err);

        }

        // console.log(req.session.creator_profile);
        res.render('recruiter/jobs', { r1: result, profilePic: req.session.profilePic, username: req.session.creator_username, toastNotification: req.query.toastNotification });
    });
};


const deleteCreatedJobs = (req, res) => {
    const job_id = req.query.job_id;
    const query = `DELETE FROM job_applications WHERE job_id = ?`;
    conn.query(query, [job_id], (err, result) => {
        if (err) {
            console.error(err);
        }
        else {
            const query1 = `Delete from job_details where job_id = ?`;
            conn.query(query1, [job_id], (err1, result1) => {
                if (err1) {
                    console.error(err1);
                }

            })
        }
        res.redirect('/jobCreator/jobList?toastNotification=Job Revomed Successfully');
    });
};

const viewJobDetails = (req, res) => {
    if (!req.session.loggedIn) {
        res.redirect('/jobCreator/login');
    } else {
        const job_id = req.query.job_id;
        const query = `SELECT * FROM job_details WHERE job_id = ?`;
        conn.query(query, [job_id], (err, result3) => {
            if (err) {
                console.error(err);
            }
            res.render('recruiter/viewjobdetails', { r3: result3, profilePic: req.session.profilePic, username: req.session.creator_username });
        });
    }
};

const openNewJobForm = (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/jobCreator/login');
    }
    const creatorId = req.session.creator_id;
    const query = `SELECT profile_photo, creator_fname, creator_lname FROM job_creator WHERE creator_id = ?`;

    conn.query(query, [creatorId], (err, result) => {
        if (err) {
            console.log(err);
            return;
        }
        const profilePic = result[0].profile_photo;
        const username = result[0].creator_fname + ' ' + result[0].creator_lname;
        // console.log(profilePic);
        res.render('recruiter/jobDetails', { profilePic: profilePic, username: username });
    });
};

const createNewJob = (req, res) => {
    const creatorId = req.session.creator_id;
    const company = req.session.company_name;

    const {job_role, job_desc, job_type, min_salary, max_salary, city, min_exp, max_exp, work_mode, qualification, due_date, job_status} = req.body;
    const skills_req = req.body.skills;

    if (!req.session.loggedIn || !req.session.creator_id) {
        return res.redirect('/jobCreator/login'); // Redirect to login if not logged in
    }

    const query = `insert into job_details (job_role, job_desc, job_type, city, company, skills_req, job_status, creator_id, due_date, work_mode, min_exp, max_exp, min_salary, max_salary, qualification) values(?,?',?',?,?,?,?,?,?,?,?,?,?,?,?)`

    const queryVariables = [job_role, job_desc, job_type, city, company, skills_req, job_status, creatorId, due_date, work_mode, min_exp, max_exp, min_salary, max_salary, qualification]

    conn.query(query, queryVariables, (err, result) => {
        if (err) {
            console.log(err);
            return;
        } else {
            res.redirect('/jobCreator/jobList?toastNotification=Job Added Successfully');
        }
    })


}

module.exports = {
    recruiterDashboard,
    openRecruiterDashboard,
    getChartsData,
    openJobApplicationPage,
    showAllApplications,
    showFilteredApplications,
    viewApplicantDetails,
    applicantDetails,
    saveUnsaveApplications,
    savedApplications,
    getSavedApplicationData,
    filteredSavedData,
    unsaveApplication,
    deleteApplication,
    showCreatedJobs,
    deleteCreatedJobs,
    viewJobDetails,
    openNewJobForm,
    createNewJob
};