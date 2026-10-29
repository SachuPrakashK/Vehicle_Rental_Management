process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'pg-mem://fleetline';
process.env.JWT_ACCESS_SECRET = 'test-only-secret-with-at-least-32-characters';
process.env.FRONTEND_ORIGIN = 'http://localhost:4200';
process.env.EXPOSE_DEVELOPMENT_RESET_TOKEN = 'true';
