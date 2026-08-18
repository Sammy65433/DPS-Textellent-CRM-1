import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        firstName: {
            type: String,
            trim: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
        },
        tags: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Contact", contactSchema);
