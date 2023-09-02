import express from 'express';
import router from './routes/index';

const app = express();
app.use(router);

const port = process.env.PORT ? process.env.PORT : 5000;
app.listen(port, () => console.log(`Server Started on port: ${port}`));

export default app;
