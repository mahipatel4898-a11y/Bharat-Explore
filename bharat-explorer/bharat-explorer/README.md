`# Bharat Explorer

AI Powered Smart Travel Platform for India, built for a premium college demo and portfolio showcase.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Three.js
- Backend: Node.js, Express.js
- Database: SQLite database file in `server/database/bharat_explorer.db`

## Run Locally

Backend:

```bash
cd server
npm install
npm start
```

Frontend:

```bash
cd client
npm install
npm run dev
```

Open the app at `http://localhost:5173`. The API runs at `http://localhost:5000`.

## Demo Admin

- Email: `admin@bharat.com`
- Password: `admin123`

## Highlights

- Premium travel homepage with a Three.js animated hero
- SQLite-powered cities, places, hotels, food spots, wishlist, reviews, trip planner, and admin data
- Seeded destinations: Ahmedabad, Jaipur, Udaipur, Goa, and Manali
- Smart search across cities, categories, tourist places, hotels, and food recommendations
- AI-style travel assistant with continuous chat flow
- Day-wise trip planner with realistic recommendations and estimated costs
- Accurate map embeds using stored latitude and longitude
- No MongoDB, Compass, or local database service setup required

## Useful Commands

Reset and seed the database:

```bash
cd server
npm run seed
```

Build the frontend:

```bash
cd client
npm run build
```
