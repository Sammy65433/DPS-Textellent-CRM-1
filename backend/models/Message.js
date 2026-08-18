import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
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
        toPhone: {
            type: String,
            required: true,
            trim: true,
        },
        fromPhone: {
            type: String,
            trim: true,
        },
        body: {
            type: String,
            required: true,
            trim: true,
        },
        direction: {
            type: String,
            enum: ["outbound", "inbound"],
            required: true,
        },
        status: {
            type: String,
            default: "queued",
        },
        twilioSid: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
