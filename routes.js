import express from 'express';
const router = express.Router();
import { validateNextAuthSession } from './authMiddleware.js';
import {
    insertUser, deleteUser, submitQuestion, makeSubmission, updateSubmissionStatus,
    getUserDetails, getAllsubmissions, getAllQuestionsPosted
} from './controllers.js';

router.route("/").get(validateNextAuthSession, (req, res) => {
    res.send('Hello World from port 5000!')
});

router.route("/insert").post(insertUser);

router.route("/delete/:id").delete(deleteUser);

router.route("/profile").get(validateNextAuthSession, getUserDetails);

router.route("/:id/submissions").get(validateNextAuthSession, getAllsubmissions);
router.route("/:id/submission/:qid").post(validateNextAuthSession, makeSubmission);
router.route("/:id/submission/:sid").patch(validateNextAuthSession, updateSubmissionStatus);


router.route("/:id/question/:qid").post(validateNextAuthSession, submitQuestion);

router.route("/:id/questions").get(validateNextAuthSession, getAllQuestionsPosted);



export default router;