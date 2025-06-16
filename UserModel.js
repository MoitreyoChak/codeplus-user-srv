import mongoose from 'mongoose';
const { Schema } = mongoose;

const question = new Schema({
    questionId: {
        type: Schema.ObjectId,
        // required: [true, "Please provide the question ID"],
    }, // this id comes from QuestionModel from questions service
    questionTitle: {
        type: String,
        required: [true, "Please provide the question title"],
    }
},
    {
        timestamps: true,
    }
);

const submission = new Schema({
    submissionId: {
        type: Schema.ObjectId,
        required: [true, "Please provide the submission ID"],
    },
    questionId: {
        type: Schema.ObjectId,
        required: [true, "Please provide the question ID"],
    },
    questionTitle: {
        type: String,
        required: [true, "Please provide the question title"],
    },
    verdict: {
        type: String,
        enum: ['AC', 'WA', 'TLE', 'compilation-error'],
    }
},
    {
        timestamps: true,
    }
);
//even if the status is updated lazily thats not a problem

const user = new Schema(
    {
        name: {
            type: String,
            unique: true,
            required: [true, "A reader must have a name"],
        },
        email: {
            type: String,
            unique: true,
            required: [true, "Email is required"],
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                "Email is invalid",
            ],
        },
        password: {
            type: String,
            required: true
        },
        questionsPosted: {
            type: [question],
            default: [],
        },
        submissions: {
            type: [submission],
            default: [],
        },
        solved: Number,
        totalQuestions: Number,
        difficultyCategory: {
            Easy: {
                total: Number,
                solved: Number
            },
            Medium: {
                total: Number,
                solved: Number
            },
            Hard: {
                total: Number,
                solved: Number
            }
        },
        languages: [{ language: String, solved: Number }],
        advancedSkills: [{
            tag: String,
            solved: Number
        }],
        intermediateSkills: [{
            tag: String,
            solved: Number
        }],
        basicSkills: [{
            tag: String,
            solved: Number
        }],
    },
    {
        timestamps: true,
    }
);


const User = mongoose.models.UserDetails || mongoose.model("users", user);

// const User = mongoose.model("UserDetails", user);
export { User };