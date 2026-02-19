// backend/src/modules/settings/index.js

import settingsRoutes from "./settings.routes.js";
import brandingRoutes from "./submodules/branding/branding.routes.js";
import hoursRoutes from "./submodules/business-hours/hours.routes.js";
import notificationsRoutes from "./submodules/notifications/notifications.routes.js";
import featuresRoutes from "./submodules/features/features.routes.js";

export {
  settingsRoutes,
  brandingRoutes,
  hoursRoutes,
  notificationsRoutes,
  featuresRoutes
};

export * from "./settings.service.js";
export * from "./settings.utils.js";