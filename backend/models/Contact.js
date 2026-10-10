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
            lowercase: true,
        },
        tags: {
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },

        // Set only through a dedicated, staff-authorized linking workflow.
        // Do not accept this value from normal contact create/edit requests.
        supabaseCustomerId: {
            type: String,
            default: null,
            select: false,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Contact", contactSchema);
