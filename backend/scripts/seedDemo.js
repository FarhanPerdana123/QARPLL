/**
 * Seed Demo Data for Cinema Booking System
 * Run: node scripts/seedDemo.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Movie = require('../models/movie');
const Hall = require('../models/Hall');
const Showtime = require('../models/Showtime');
const Seat = require('../models/Seat');

const HALLS = [
  {
    name: 'Hall A - Regular',
    totalRows: 8,
    totalCols: 10,
    seatCapacity: 80,
    seatLayout: Array.from({ length: 8 }, () => Array(10).fill(1)),
  },
  {
    name: 'Hall B - Deluxe',
    totalRows: 6,
    totalCols: 12,
    seatCapacity: 72,
    seatLayout: Array.from({ length: 6 }, () => Array(12).fill(1)),
  },
];

const MOVIES = [
  {
    title: 'The Dark Knight',
    description: 'Batman faces the Joker, a criminal mastermind who plunges Gotham City into anarchy.',
    duration: 152,
    genre: ['Action', 'Drama', 'Thriller'],
    rating: 9.0,
    posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/hqkIcbrOHL86UncnHIsHVcVmzue.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
    status: 'now',
  },
  {
    title: 'Inception',
    description: 'A thief who steals corporate secrets through dream-sharing technology is given a chance at redemption.',
    duration: 148,
    genre: ['Action', 'Sci-Fi', 'Thriller'],
    rating: 8.8,
    posterUrl: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    status: 'now',
  },
  {
    title: 'Interstellar',
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    duration: 169,
    genre: ['Adventure', 'Drama', 'Sci-Fi'],
    rating: 8.7,
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/xu9zaAevzQ5nnrsXN6JcahLnG4i.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    status: 'now',
  },
  {
    title: 'The Matrix',
    description: 'A computer hacker learns from mysterious rebels about the true nature of his reality.',
    duration: 136,
    genre: ['Action', 'Sci-Fi'],
    rating: 8.7,
    posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=vKQi3bBA1y8',
    status: 'now',
  },
  {
    title: 'Spider-Man: Across the Spider-Verse',
    description: 'Miles Morales catapults across the Multiverse and meets a team of Spider-People.',
    duration: 140,
    genre: ['Animation', 'Action', 'Adventure'],
    rating: 8.6,
    posterUrl: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
    status: 'soon',
  },
  {
    title: 'Dune: Part Two',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    duration: 166,
    genre: ['Sci-Fi', 'Adventure', 'Drama'],
    rating: 8.5,
    posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    status: 'soon',
  },
];

const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function buildShowtimes(movies, halls) {
  const showtimes = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const push = (movie, hall, daysFromNow, startTime, price) => {
    const date = new Date(today);
    date.setDate(date.getDate() + daysFromNow);
    showtimes.push({ movie, hall, date, startTime, price });
  };

  // Hall A - Regular
  push(movies[0], halls[0], 0, '13:00', 45000);
  push(movies[1], halls[0], 0, '16:30', 45000);
  push(movies[2], halls[0], 1, '19:00', 50000);
  push(movies[3], halls[0], 1, '21:30', 50000);
  push(movies[0], halls[0], 2, '13:00', 45000);

  // Hall B - Deluxe
  push(movies[1], halls[1], 0, '14:00', 65000);
  push(movies[2], halls[1], 0, '18:00', 75000);
  push(movies[3], halls[1], 1, '15:30', 70000);
  push(movies[0], halls[1], 2, '19:30', 70000);

  return showtimes;
}

function generateSeatsForShowtime(showtime, hall) {
  const seats = [];
  hall.seatLayout.forEach((rowArr, rIndex) => {
    const rowLabel = ROW_LABELS[rIndex];
    rowArr.forEach((status, cIndex) => {
      if (Number(status) === 1) {
        seats.push({
          showtimeId: showtime._id,
          row: rowLabel,
          number: cIndex + 1,
          price: Number(showtime.price) || 0,
          status: 'available',
        });
      }
    });
  });
  return seats;
}

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB:', process.env.MONGODB_URI);

    // Clean existing data (optional but makes seed idempotent)
    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Hall.deleteMany({}),
      Showtime.deleteMany({}),
      Seat.deleteMany({}),
    ]);
    console.log('Cleared old demo data');

    // 1. Users
    await User.create({
      name: 'Admin',
      email: 'admin@cinema.com',
      password: 'admin123',
      role: 'admin',
      isEmailVerified: true,
    });

    await User.create({
      name: 'Demo Customer',
      email: 'customer@cinema.com',
      password: 'customer123',
      role: 'customer',
      isEmailVerified: true,
    });

    console.log('Users created:');
    console.log('  Admin    -> admin@cinema.com / admin123');
    console.log('  Customer -> customer@cinema.com / customer123');

    // 2. Movies
    const movieDocs = await Movie.insertMany(MOVIES);
    console.log(`Created ${movieDocs.length} movies`);

    // 3. Halls
    const hallDocs = await Hall.insertMany(HALLS);
    console.log(`Created ${hallDocs.length} halls`);

    // 4. Showtimes
    const showtimeDefs = buildShowtimes(movieDocs, hallDocs);
    const showtimeDocs = await Showtime.insertMany(
      showtimeDefs.map((st) => ({ ...st, movie: st.movie._id, hall: st.hall._id }))
    );
    console.log(`Created ${showtimeDocs.length} showtimes`);

    // 5. Seats
    let seatCount = 0;
    for (const showtime of showtimeDocs) {
      const hall = hallDocs.find(
        (h) => String(h._id) === String(showtime.hall)
      );
      if (!hall) continue;
      const seats = generateSeatsForShowtime(showtime, hall);
      if (Array.isArray(seats) && seats.length > 0) {
        await Seat.insertMany(seats);
        seatCount += seats.length;
      }
    }
    console.log(`Created ${seatCount} seats`);

    console.log('\n✅ Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
