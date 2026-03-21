import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module.js';

const getRequest = async () => (await import('supertest')).default;

describe('Auth & Books API (e2e)', () => {
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

  describe('Auth', () => {
    it('POST /auth/register - rejects invalid body (400)', async () => {
      const req = await getRequest();
      return req(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'X' }) // missing required email/password
        .expect(400);
    });

    it('POST /auth/login - rejects bad credentials (401)', async () => {
      const req = await getRequest();
      return req(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'invalid@example.com', password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('Books', () => {
    it('GET /books - returns paginated list without auth (200)', async () => {
      const req = await getRequest();
      const res = await req(app.getHttpServer()).get('/books').expect(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
    });

    it('POST /books - requires authentication (401)', async () => {
      const req = await getRequest();
      return req(app.getHttpServer())
        .post('/books')
        .send({ title: 'Test', author: 'Author', publicationYear: 2020 })
        .expect(401);
    });

    it('PATCH /books/:id - requires authentication (401)', async () => {
      const req = await getRequest();
      return req(app.getHttpServer())
        .patch('/books/1')
        .send({ title: 'Updated' })
        .expect(401);
    });

    it('DELETE /books/:id - requires authentication (401)', async () => {
      const req = await getRequest();
      return req(app.getHttpServer())
        .delete('/books/1')
        .expect(401);
    });
  });
});
