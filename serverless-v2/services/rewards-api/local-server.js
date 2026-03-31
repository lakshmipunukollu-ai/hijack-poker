'use strict';
const { app } = require('./handler');
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Rewards API running on http://localhost:${PORT}`));
