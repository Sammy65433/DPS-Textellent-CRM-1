import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        body: {
            type: String,
            trim: true,
            default: "",
        },
        subject: {
            type: String,
            trim: true,
            default: "",
        },
        type: {
            type: String,
            enum: ["sms", "email", "both"],
            default: "sms",
        },
        templateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Template",
            default: null,
        },
        contactIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Contact",
            },
        ],
        status: {
            type: String,
            enum: ["draft", "sent"],
            default: "draft",
        },
    },
    { timestamps: true }
);

export default mongoose.model("Campaign", campaignSchema);
