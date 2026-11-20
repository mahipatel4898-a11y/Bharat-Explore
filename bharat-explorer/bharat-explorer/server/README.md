# Bharat Explorer Server

SQLite backend for Bharat Explorer. No MongoDB, Compass, or local database service is required.
The backend uses Node.js built-in SQLite support, so there is no native SQLite npm package to compile.

## Run Locally

```bash
npm install
npm start
```

The API starts on `http://localhost:5000` by default.

## Database

- Database file: `server/database/bharat_explorer.db`
- Schema setup: `server/config/database.js`
- Data access helpers: `server/repositories/travelRepository.js`
- Seed data: `server/data/sampleData.js`
- Reset and seed manually:

```bash
npm run seed
```

## Demo Admin

- Email: `admin@bharat.com`
- Password: `admin123`

## Main Routes

- `/api/auth`
- `/api/cities`
- `/api/places`
- `/api/hotels`
- `/api/food`
- `/api/search`
- `/api/wishlist`
- `/api/reviews`
- `/api/admin`
- `/api/trip`
