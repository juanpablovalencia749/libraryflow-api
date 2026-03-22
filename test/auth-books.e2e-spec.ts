import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module.js';
import cookieParser from 'cookie-parser';

const getRequest = async () => (await import('supertest')).default;

describe('Auth & Books API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('POST /auth/login - sets HttpOnly cookie (200)', async () => {
      const req = await getRequest();
      const res = await req(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@library.com', password: 'adminpassword' })
        .expect(200);
      
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).not.toHaveProperty('refresh_token');
      
      const cookies = res.get('Set-Cookie');
      expect(cookies).toBeDefined();
      if (cookies) {
        expect(cookies[0]).toContain('refresh_token=');
        expect(cookies[0]).toContain('HttpOnly');
      }
    });

    it('POST /auth/refresh - works with cookie (200)', async () => {
      const req = await getRequest();
      // Login first to get cookie
      const loginRes = await req(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@library.com', password: 'adminpassword' });
      
      const cookies = loginRes.get('Set-Cookie');
      const cookie = cookies ? cookies[0] : '';
      const accessToken = loginRes.body.access_token;

      // Refresh using cookie AND access token (for Guard)
      const res = await req(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [cookie])
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(res.body).toHaveProperty('access_token');
    });

    it('POST /auth/refresh - fails without cookie (401)', async () => {
      const req = await getRequest();
      const loginRes = await req(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@library.com', password: 'adminpassword' });
      
      const accessToken = loginRes.body.access_token;

      return req(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  describe('Books', () => {
    it('GET /books - returns list (200)', async () => {
      const req = await getRequest();
      return req(app.getHttpServer()).get('/books').expect(200);
    });
  });
});
