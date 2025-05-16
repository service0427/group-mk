import React from 'react';
import { hydrateRoot } from 'react-dom';
import { CampaignSlotWithKeywordModal } from './src/pages/advertise/components/campaign-modals/CampaignSlotWithKeywordModal';
const App = () => <CampaignSlotWithKeywordModal open={true} onClose={() => {}} category="test" />;
console.log('JSX parsed successfully');