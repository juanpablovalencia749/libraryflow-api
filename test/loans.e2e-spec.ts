import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module.js';
import cookieParser from 'cookie-parser';

const getRequest = async () => (await import('supertest')).default;

describe('Loans API (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let authCookie: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const req = await getRequest();
    const loginRes = await req(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@library.com', password: 'adminpassword' });
    
    accessToken = loginRes.body.access_token;
    const cookies = loginRes.get('Set-Cookie');
    authCookie = cookies || [];
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /loans/my-loans - returns list (200)', async () => {
    const req = await getRequest();
    return req(app.getHttpServer())
      .get('/loans/my-loans')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('POST /loans/reserve - fails if book not found (404)', async () => {
    const req = await getRequest();
    return req(app.getHttpServer())
      .post('/loans/reserve')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bookId: 9999 })
      .expect(404);
  });
});
