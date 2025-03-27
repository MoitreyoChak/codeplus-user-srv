import { User } from "./UserModel.js";
import catchAsyncError from "./catchAsync.js";

const insertUser = catchAsyncError(async (req, res) => {
    const user = {
        name: req.body.name,
        email: req.body.email
    }
    await User.create(user);

    res.status(200).json({
        status: 'success'
    });
})

const deleteUser = catchAsyncError(async (req, res) => {
    const result = await User.findByIdAndDelete(req.params.id);

    const resObj = {
        status: 'success'
    }
    let statusCode = 200;

    if (result == null) {
        resObj.status = 'error'
        resObj.message = 'please check the provided userId. If a valid Id is provided please retry after a while.'
        statusCode = 500;
    }

    res.status(statusCode).json(resObj);
})

// const updateUser = async (req, res) => { }

const getUserDetails = catchAsyncError(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id).select("-_id -__v -createdAt -updatedAt").lean();

    if (!user) {
        return res.status(404).json({ status: 'success', message: "User not found" });
    }

    user.submissions = user.submissions.slice(-3); // Get latest 3 submissions
    user.questionsPosted = user.questionsPosted.slice(-3); // Get latest 3 questions posted

    res.status(200).json(user);
})

const getAllsubmissions = catchAsyncError(async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(id).select("submissions").lean();

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const totalSubmissions = user.submissions.length;
    const submissions = user.submissions.slice(skip, skip + limit);

    res.status(200).json({
        totalSubmissions, submissions, page, limit
    });
})

const submitQuestion = catchAsyncError(async (req, res) => {
    const user = await User.findById(req.params.id).select("questionsPosted").lean();
    let statusCode = 200;
    let resObj = { status: "success" }

    if (!req.params.qid) {
        statusCode = 400;
        resObj.status = "error";
        resObj.message = "Please provide question Id"
    }

    if (!req.body.title) {
        statusCode = 400;
        resObj.status = "error";
        resObj.message = "Please provide question title"
    }

    const question = {
        questionId: req.params.qid,
        questionTitle: req.body.title
    }
    user.questionsPosted.push(question);

    if (resObj.status === "success") await User.findByIdAndUpdate(req.params.id, user)

    res.status(statusCode).json(resObj);
})


const makeSubmission = catchAsyncError(async (req, res) => {
    const user = await User.findById(req.params.id).select("submissions").lean();

    let statusCode = 200;
    let resObj = { status: "success" }

    if (!req.params.qid) {
        statusCode = 400;
        resObj.status = "error";
        resObj.message = "Please provide question Id"
    } else {
        let questions = await User.findOne({ name: req.body.problemSetter }).select("questionsPosted -_id").lean();
        questions = questions.questionsPosted;
        console.log(questions)
        const checkUsername = obj => obj.questionId.toString() === req.params.qid;
        if (!questions.some(checkUsername)) {
            statusCode = 400;
            resObj.status = "error";
            resObj.message = "Question not found. Please provide a valid question Id!"
        };
    }

    if (!req.body.title) {
        statusCode = 400;
        resObj.status = "error";
        resObj.message = "Please provide question title"
    }

    const submission = {
        questionId: req.params.qid,
        questionTitle: req.body.title,
        status: req.body.status
    }

    if (resObj.status === "success") user.submissions.push(submission);

    await User.findByIdAndUpdate(req.params.id, user)

    res.status(statusCode).json(resObj);
})

const updateSubmissionStatus = catchAsyncError(async (req, res) => {
    let submissions = await User.findById(req.params.id).select("submissions -_id").lean();
    let statusCode = 200;
    let resObj = { status: "success" }

    if (!submissions) {
        statusCode = 400;
        resObj.status = "error";
        resObj.message = "User not found. Please provide a valid user Id!"
    } else {
        submissions = submissions?.submissions;
    }

    let found = false;

    const findSubmissionAndUpdate = obj => {
        if (obj._id.toString() === req.params.sid) {
            obj.status = req.body.status;
            found = true;
        }
    }
    submissions?.forEach(findSubmissionAndUpdate);

    if (!found) {
        statusCode = 400;
        resObj.status = "error";
        resObj.message = "Submission not found. Please provide a valid submission Id!"
    }

    if (found && resObj.status === "success") {
        await User.findByIdAndUpdate(req.params.id, { $set: { submissions } });
    }

    res.status(statusCode).json(resObj);
})


const getAllQuestionsPosted = catchAsyncError(async (req, res) => {
    let questions = await User.findById(req.params.id).select("questionsPosted -_id").lean();
    let statusCode = 200;
    let resObj = { status: "success" }

    if (!questions) {
        statusCode = 400;
        resObj.status = "error";
        resObj.message = "User not found. Please provide a valid user Id!"
    }
    questions = questions?.questionsPosted;

    if (resObj.status === "success") resObj.questions = questions
    res.status(statusCode).json(resObj);

})

export {
    insertUser, deleteUser, submitQuestion, updateSubmissionStatus,
    makeSubmission, getUserDetails, getAllsubmissions, getAllQuestionsPosted
}