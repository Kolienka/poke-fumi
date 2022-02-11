import bodyParser from 'body-parser';
import express from 'express';
import * as routes from './routes';

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}))
routes.register(app);

export {app};