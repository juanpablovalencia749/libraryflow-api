import "dotenv/config";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient({
  adapter: new PrismaMssql({
    server: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT ?? 1433),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  }),
});

const coverUrl = (isbn: string) =>
  `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

const seedBooks = [
  {
    title: "1984",
    author: "George Orwell",
    publicationYear: 1949,
    isbn: "9780141036144",
  },
  {
    title: "Don Quijote de la Mancha",
    author: "Miguel de Cervantes Saavedra",
    publicationYear: 1605,
    isbn: "9788478733057",
  },
  {
    title: "Cien años de soledad",
    author: "Gabriel García Márquez",
    publicationYear: 1967,
    isbn: "8482800000",
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    publicationYear: 1937,
    isbn: "9780007591855",
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    publicationYear: 1813,
    isbn: "9780192827609",
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    publicationYear: 1925,
    isbn: "9780140623239",
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    publicationYear: 1960,
    isbn: "9780758777980",
  },
  {
    title: "The Catcher in the Rye",
    author: "J. D. Salinger",
    publicationYear: 1951,
    isbn: "9780553239768",
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    publicationYear: 1988,
    isbn: "9780061122415",
  },
  {
    title: "Little Women",
    author: "Louisa May Alcott",
    publicationYear: 1868,
    isbn: "9781593083663",
  },
  {
    title: "Moby Dick",
    author: "Herman Melville",
    publicationYear: 1851,
    isbn: "9788807900761",
  },
];

async function main() {
  console.log("Seeding database...");

  const users: any[] = [];

  for (let i = 0; i < 5; i++) {
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        passwordHash: faker.internet.password(),
        role: i % 2 === 0 ? "USER" : "ADMIN",
        isActive: true,
      },
    });

    users.push(user);
  }

  const books: any[] = [];

  for (const bookData of seedBooks) {
    const book = await prisma.book.create({
      data: {
        title: bookData.title,
        author: bookData.author,
        publicationYear: bookData.publicationYear,
        status: "AVAILABLE",
        imageUrl: coverUrl(bookData.isbn),
        createdById:
          users[faker.number.int({ min: 0, max: users.length - 1 })].id,
      },
    });

    books.push(book);
  }

  for (let i = 0; i < 5; i++) {
    await prisma.loan.create({
      data: {
        bookId: books[faker.number.int({ min: 0, max: books.length - 1 })].id,
        userId: users[faker.number.int({ min: 0, max: users.length - 1 })].id,
        status: "ACTIVE",
      },
    });
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });