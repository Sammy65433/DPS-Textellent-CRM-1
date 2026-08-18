import mongoose from "mongoose";

const emailMessageSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        contactId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contact",
            default: null,
        },
        toEmail: {
            type: String,
            required: true,
            trim: true,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        body: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            default: "sent",
        },
        resendId: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

export default mongoose.model("EmailMessage", emailMessageSchema);
