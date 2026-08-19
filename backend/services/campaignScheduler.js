import Campaign from "../models/Campaign.js";
import { processCampaignSend } from "../controllers/campaignsController.js";

export const startCampaignScheduler = () => {
    setInterval(async () => {
        try {
            const now = new Date();

            const dueCampaigns = await Campaign.find({
                status: "scheduled",
                scheduledAt: { $lte: now },
            });

            for (const campaign of dueCampaigns) {
                console.log("Processing scheduled campaign:", campaign.name);
                await processCampaignSend(campaign);
            }
        } catch (error) {
            console.error("Scheduler error:", error.message);
        }
    }, 60000);
};
