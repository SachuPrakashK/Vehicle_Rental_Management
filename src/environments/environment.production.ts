export const environment = {
  production: true,
  apiBaseUrl: 'https://freeapi.gerasim.in/api/CarRentalApp',
  authApiBaseUrl: '/api',
  blobImageUploads: true,
  currency: 'INR',
  fleet: {
    maintenance: true,
    health: true,
    tracking: true,
    geofencing: true,
    predictions: true,
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileAttribution: '&copy; OpenStreetMap contributors',
  },
} as const;
