const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\nBharat Explorer Server running on http://localhost:${PORT}`);
  console.log(`API Health: http://localhost:${PORT}/api/health\n`);
});
