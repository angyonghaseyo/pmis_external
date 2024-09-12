const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');
const userWorkspaceRoutes = require('./routes/userWorkspace');
const userAccountManagementRoutes = require('./routes/userAccountManagement');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authMiddleware);
app.use('/api', userWorkspaceRoutes);
app.use('/api', userAccountManagementRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));