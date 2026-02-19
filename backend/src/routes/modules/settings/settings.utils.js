// backend/src/modules/settings/settings.utils.js
import crypto from 'crypto';
/**
 * Validate color hex code
 */
export function isValidColor(color) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Validate business hours format
 */
export function isValidBusinessHours(hours) {
  if (!hours || typeof hours !== 'object') return false;
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const day of days) {
    const dayConfig = hours[day];
    if (!dayConfig) continue;
    
    if (dayConfig.isWorking) {
      if (!dayConfig.start || !dayConfig.end) return false;
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dayConfig.start)) return false;
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dayConfig.end)) return false;
    }
  }
  
  return true;
}

/**
 * Validate email template
 */
export function isValidEmailTemplate(template) {
  const required = ['subject', 'body'];
  for (const field of required) {
    if (!template[field]) return false;
  }
  return true;
}

/**
 * Merge settings with defaults
 */
export function mergeWithDefaults(userSettings, defaults) {
  return {
    ...defaults,
    ...userSettings,
    branding: {
      ...defaults.branding,
      ...(userSettings.branding || {})
    },
    businessHours: {
      ...defaults.businessHours,
      ...(userSettings.businessHours || {})
    },
    notifications: {
      ...defaults.notifications,
      ...(userSettings.notifications || {})
    },
    features: {
      ...defaults.features,
      ...(userSettings.features || {})
    }
  };
}

/**
 * Get default settings
 */
export function getDefaultSettings() {
  return {
    branding: {
      hospitalName: null,
      logoUrl: null,
      faviconUrl: null,
      primaryColor: '#2563eb',
      secondaryColor: '#4b5563',
      accentColor: '#10b981',
      fontFamily: 'Inter, system-ui, sans-serif',
      theme: 'light', // light, dark, system
      density: 'comfortable', // compact, comfortable, spacious
      borderRadius: 'md', // none, sm, md, lg, full
      customCss: null
    },
    
    businessHours: {
      monday: { isWorking: true, start: '09:00', end: '17:00' },
      tuesday: { isWorking: true, start: '09:00', end: '17:00' },
      wednesday: { isWorking: true, start: '09:00', end: '17:00' },
      thursday: { isWorking: true, start: '09:00', end: '17:00' },
      friday: { isWorking: true, start: '09:00', end: '17:00' },
      saturday: { isWorking: false, start: null, end: null },
      sunday: { isWorking: false, start: null, end: null },
      holidays: [],
      timezone: 'Africa/Nairobi'
    },
    
    appointments: {
      defaultSlotDuration: 15,
      maxAdvanceBooking: 30, // days
      allowWalkIns: true,
      requirePrepayment: false,
      allowOnlineBooking: true,
      cancellationPolicy: '24 hours notice required',
      noShowFee: 0
    },
    
    notifications: {
      email: {
        enabled: true,
        smtpHost: null,
        smtpPort: 587,
        smtpSecure: true,
        smtpUser: null,
        smtpPass: null,
        fromEmail: null,
        fromName: null
      },
      sms: {
        enabled: false,
        provider: 'africastalking',
        apiKey: null,
        senderId: null
      },
      templates: {
        appointmentConfirmation: {
          subject: 'Appointment Confirmation',
          body: 'Your appointment is confirmed for {{date}} at {{time}} with Dr. {{doctor}}.'
        },
        appointmentReminder: {
          subject: 'Appointment Reminder',
          body: 'Reminder: You have an appointment tomorrow at {{time}} with Dr. {{doctor}}.'
        },
        labResultReady: {
          subject: 'Lab Results Ready',
          body: 'Your lab results are ready. Please log in to view.'
        },
        paymentReceipt: {
          subject: 'Payment Receipt',
          body: 'Thank you for your payment of {{amount}}. Receipt #{{receipt}}'
        }
      }
    },
    
    security: {
      passwordMinLength: 8,
      passwordRequireNumbers: true,
      passwordRequireSpecial: false,
      maxLoginAttempts: 5,
      lockoutDuration: 30, // minutes
      sessionTimeout: 60, // minutes
      twoFactorAuth: false,
      ipWhitelist: []
    },
    
    billing: {
      currency: 'KES',
      taxRate: 16, // percentage
      invoicePrefix: 'INV',
      receiptPrefix: 'RCP',
      paymentMethods: ['CASH', 'CARD', 'MPESA', 'BANK_TRANSFER'],
      defaultPaymentTerms: 30 // days
    },
    
    features: {
      patients: true,
      doctors: true,
      appointments: true,
      pharmacy: true,
      laboratory: true,
      vitals: true,
      billing: true,
      admissions: true,
      medicalRecords: true,
      patientPortal: false,
      telemedicine: false,
      reports: true
    },
    
    printer: {
      enabled: true,
      labelPrinter: null,
      receiptPrinter: null,
      autoPrintLabels: true,
      autoPrintReceipts: true
    },
    
    backup: {
      enabled: true,
      frequency: 'daily', // hourly, daily, weekly
      retentionDays: 30,
      lastBackup: null,
      backupLocation: null
    }
  };
}

/**
 * Sanitize settings for different roles
 */
export function sanitizeSettings(settings, userRole) {
  if (userRole === 'SYSTEM_ADMIN') {
    return settings; // Full access
  }
  
  if (userRole === 'HOSPITAL_ADMIN') {
    // Hide sensitive security settings
    const { security, ...rest } = settings;
    return {
      ...rest,
      security: {
        ...security,
        ipWhitelist: undefined,
        smtpPass: undefined
      }
    };
  }
  
  // Limited view for other roles
  return {
    branding: settings.branding,
    businessHours: settings.businessHours,
    features: settings.features
  };
}

/**
 * Generate backup filename
 */
export function generateBackupFilename(hospitalCode) {
  const date = new Date().toISOString().split('T')[0];
  return `${hospitalCode}_backup_${date}.json`;
}

/**
 * Calculate settings version hash
 */
export function calculateSettingsHash(settings) {
  return crypto
    .createHash('md5')
    .update(JSON.stringify(settings))
    .digest('hex');
}
