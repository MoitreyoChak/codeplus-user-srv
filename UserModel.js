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
    status: {
        type: String,
        enum: ['AC', 'WA', 'TLE'],
        default: 'pending'
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
        questionsPosted: {
            type: [question],
            default: [],
        },
        submissions: {
            type: [submission],
            default: [],
        },
        solved: Number
    },
    {
        timestamps: true,
    }
);


const User = mongoose.models.UserDetails || mongoose.model("UserDetails", user);

// const User = mongoose.model("UserDetails", user);
export { User };