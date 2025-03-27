import express from 'express';
const router = express.Router();
import {
    insertUser, deleteUser, submitQuestion, makeSubmission, updateSubmissionStatus,
    getUserDetails, getAllsubmissions, getAllQuestionsPosted
} from './controllers.js';

router.route("/").get((req, res) => {
    res.send('Hello World from port 5000!')
});

router.route("/insert").post(insertUser);

router.route("/delete/:id").post(deleteUser);

router.route("/:id").get(getUserDetails);

router.route("/:id/submissions").get(getAllsubmissions);
router.route("/:id/submission/:qid").post(makeSubmission);
router.route("/:id/submission/:sid").patch(updateSubmissionStatus);


router.route("/:id/question/:qid").post(submitQuestion);

router.route("/:id/questions").get(getAllQuestionsPosted);

export default router;