import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module.js';

// Dynamic import for ESM/CJS supertest compat
const getRequest = async () => (await import('supertest')).default;

describe('AppModule bootstrap (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register - should fail 400 for invalid body', async () => {
    const req = await getRequest();
    return req(app.getHttpServer())
      .post('/auth/register')
      .send({ name: '' })
      .expect(400);
  });

  it('POST /auth/login - should fail 401 for wrong credentials', async () => {
    const req = await getRequest();
    return req(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrongpass' })
      .expect(401);
  });

  it('GET /books - should return 200 paginated list', async () => {
    const req = await getRequest();
    return req(app.getHttpServer()).get('/books').expect(200);
  });

  it('POST /books - should fail 401 without JWT', async () => {
    const req = await getRequest();
    return req(app.getHttpServer())
      .post('/books')
      .send({ title: 'Test', author: 'Someone', publicationYear: 2020 })
      .expect(401);
  });
});
