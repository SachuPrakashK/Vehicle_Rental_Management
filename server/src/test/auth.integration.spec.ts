import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { pool } from '../config/database.js';
import { env } from '../config/env.js';

interface SessionBody {
  success: boolean;
  message: string;
  data: { accessToken: string; user: { id: string; email: string; role: string } };
}
const password = 'StrongPassword@123';
let token = '';
let userId = '';

beforeAll(async () => {
  for (const migration of ['001_auth.sql', '002_bikes.sql'])
    await pool.query(await fs.readFile(path.resolve('src/database/migrations', migration), 'utf8'));
});
afterAll(async () => {
  await pool.end();
});

describe('authentication API', () => {
  it('registers with a hash and sanitizes the response', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Sachu',
        lastName: 'Prakash',
        email: 'sachu@example.com',
        phone: '9876543210',
        password,
        confirmPassword: password,
      })
      .expect(201);
    expect(response.body.data).not.toHaveProperty('passwordHash');
    expect(response.body.data.role).toBe('STAFF');
    const stored = await pool.query<{ id: string; password_hash: string }>(
      'SELECT id,password_hash FROM users WHERE email=$1',
      ['sachu@example.com'],
    );
    userId = stored.rows[0]!.id;
    expect(stored.rows[0]!.password_hash).not.toBe(password);
    expect(await bcrypt.compare(password, stored.rows[0]!.password_hash)).toBe(true);
  });
  it('rejects duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Sachu',
        lastName: 'Prakash',
        email: 'sachu@example.com',
        phone: '9876543210',
        password,
        confirmPassword: password,
      })
      .expect(409);
  });
  it('rejects unknown accounts and invalid passwords with the same message', async () => {
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password })
      .expect(401);
    const invalid = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sachu@example.com', password: 'WrongPassword@123' })
      .expect(401);
    expect(unknown.body.message).toBe(invalid.body.message);
  });
  it('logs in, reads me, and rejects expired access tokens', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sachu@example.com', password })
      .expect(200);
    token = (login.body as SessionBody).data.accessToken;
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    await request(app).get('/api/auth/me').expect(401);
    const expired = jwt.sign({ role: 'STAFF', type: 'access' }, env.JWT_ACCESS_SECRET, {
      subject: userId,
      expiresIn: -1,
      issuer: 'fleetline-api',
      audience: 'fleetline-web',
    });
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer ' + expired)
      .expect(401);
  });
  it('rotates refresh tokens and detects reuse', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sachu@example.com', password })
      .expect(200);
    const oldCookie = login.headers['set-cookie']![0]!;
    const rotated = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', oldCookie)
      .expect(200);
    const newCookie = rotated.headers['set-cookie']![0]!;
    await request(app).post('/api/auth/refresh-token').set('Cookie', oldCookie).expect(401);
    await request(app).post('/api/auth/refresh-token').set('Cookie', newCookie).expect(401);
  });
  it('logs out and prevents session reuse', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sachu@example.com', password })
      .expect(200);
    const cookie = login.headers['set-cookie']![0]!;
    await request(app).post('/api/auth/logout').set('Cookie', cookie).expect(200);
    await request(app).post('/api/auth/refresh-token').set('Cookie', cookie).expect(401);
  });
  it('uses generic forgot responses and single-use reset tokens', async () => {
    const unknown = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unknown@example.com' })
      .expect(200);
    const known = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'sachu@example.com' })
      .expect(200);
    expect(unknown.body.message).toBe(known.body.message);
    const resetToken = known.body.data.resetToken as string;
    await request(app).post('/api/auth/verify-reset-token').send({ token: resetToken }).expect(200);
    const newPassword = 'NewPassword@123';
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, password: newPassword, confirmPassword: newPassword })
      .expect(200);
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, password: newPassword, confirmPassword: newPassword })
      .expect(400);
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'sachu@example.com', password })
      .expect(401);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sachu@example.com', password: newPassword })
      .expect(200);
    token = (login.body as SessionBody).data.accessToken;
  });
  it('changes passwords and revokes the refresh session', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sachu@example.com', password: 'NewPassword@123' })
      .expect(200);
    const session = (login.body as SessionBody).data;
    const cookie = login.headers['set-cookie']![0]!;
    await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', 'Bearer ' + session.accessToken)
      .send({
        currentPassword: 'bad',
        newPassword: 'FinalPassword@123',
        confirmPassword: 'FinalPassword@123',
      })
      .expect(400);
    await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', 'Bearer ' + session.accessToken)
      .send({
        currentPassword: 'NewPassword@123',
        newPassword: 'FinalPassword@123',
        confirmPassword: 'FinalPassword@123',
      })
      .expect(200);
    await request(app).post('/api/auth/refresh-token').set('Cookie', cookie).expect(401);
  });
  it('updates the profile and validates profile images server-side', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sachu@example.com', password: 'FinalPassword@123' })
      .expect(200);
    token = (login.body as SessionBody).data.accessToken;
    const updated = await request(app)
      .put('/api/auth/me')
      .set('Authorization', 'Bearer ' + token)
      .send({ firstName: 'Sachin', lastName: 'Prakash', phone: '9876543210' })
      .expect(200);
    expect(updated.body.data.firstName).toBe('Sachin');
    await request(app)
      .post('/api/auth/me/profile-image')
      .set('Authorization', 'Bearer ' + token)
      .attach('image', Buffer.from('not an image'), {
        filename: 'fake.png',
        contentType: 'image/png',
      })
      .expect(422);
    await request(app)
      .post('/api/auth/me/profile-image')
      .set('Authorization', 'Bearer ' + token)
      .attach('image', Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: 'large.png',
        contentType: 'image/png',
      })
      .expect(413);
    const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.alloc(32)]);
    await request(app)
      .post('/api/auth/me/profile-image')
      .set('Authorization', 'Bearer ' + token)
      .attach('image', png, { filename: 'profile.png', contentType: 'image/png' })
      .expect(200);
    await request(app)
      .delete('/api/auth/me/profile-image')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
  });
  it('enforces admin authorization', async () => {
    await request(app)
      .get('/api/admin/users')
      .set('Authorization', 'Bearer ' + token)
      .expect(403);
    const hash = await bcrypt.hash(password, 12);
    const admin = await pool.query<{ id: string }>(
      "INSERT INTO users(first_name,last_name,email,password_hash,role) VALUES('Super','Admin','root@example.com',$1,'SUPER_ADMIN') RETURNING id",
      [hash],
    );
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'root@example.com', password })
      .expect(200);
    const adminToken = (login.body as SessionBody).data.accessToken;
    await request(app)
      .get('/api/admin/users')
      .set('Authorization', 'Bearer ' + adminToken)
      .expect(200);
    await request(app)
      .delete('/api/admin/users/' + admin.rows[0]!.id)
      .set('Authorization', 'Bearer ' + adminToken)
      .expect(400);
  });
  it('uploads vehicle images and manages bikes', async () => {
    const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.alloc(32)]);
    const image = await request(app)
      .post('/api/vehicles/images')
      .set('Authorization', 'Bearer ' + token)
      .attach('image', png, { filename: 'bike.png', contentType: 'image/png' })
      .expect(201);
    expect(image.body.data.url).toMatch(/^\/uploads\/vehicle-images\//);
    const input = {
      brand: 'Royal Enfield',
      model: 'Classic 350',
      year: 2026,
      color: 'Green',
      dailyRate: 900,
      image: image.body.data.url,
      registrationNumber: 'BIKE-TEST-1',
      available: true,
      status: 'ACTIVE',
    };
    const created = await request(app)
      .post('/api/bikes')
      .set('Authorization', 'Bearer ' + token)
      .send(input)
      .expect(201);
    const id = created.body.data.id as number;
    await request(app)
      .get('/api/bikes/' + id)
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    await request(app)
      .put('/api/bikes/' + id)
      .set('Authorization', 'Bearer ' + token)
      .send({ ...input, available: false, status: 'MAINTENANCE' })
      .expect(200);
    await request(app)
      .get('/api/bikes')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    await request(app)
      .delete('/api/bikes/' + id)
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
  });
});
