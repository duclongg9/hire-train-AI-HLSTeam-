const fs = require('fs');
const files = [
  { path: 'frontend/app/(hr)/hr/campaigns/page.tsx', title: 'Campaigns', subtitle: 'Manage recruitment campaigns' },
  { path: 'frontend/app/(hr)/hr/campaigns/[campaignId]/page.tsx', title: 'Campaign Summary', subtitle: 'Details of the selected campaign' },
  { path: 'frontend/app/(hr)/hr/campaigns/[campaignId]/position/[positionId]/page.tsx', title: 'Position Details', subtitle: 'Details of the selected position' }
];

for (const file of files) {
  let content = fs.readFileSync(file.path, 'utf8');
  content = content.replace('<PageHeader />', `<PageHeader title="${file.title}" subtitle="${file.subtitle}" />`);
  fs.writeFileSync(file.path, content);
}
