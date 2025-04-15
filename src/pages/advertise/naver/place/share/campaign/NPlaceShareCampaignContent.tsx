import { AdMiscFaq } from "@/partials/misc";
import { Campaigns } from "./blocks/Campaigns";

const NPlaceShareCampaignContent = () => {

    return (
        <div className="grid gap-5 lg:gap-7.5">
            <Campaigns />

            <AdMiscFaq />
        </div>
    );
};

export { NPlaceShareCampaignContent };
