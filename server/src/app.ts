import express from 'express'
import cors from 'cors';
import cookieParser from 'cookie-parser'


const app = express()


app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));


app.use(express.json({
  limit: "16kb"
}))

app.use(express.urlencoded({
  extended: true,
  limit: "16kb"
}))

app.use(express.static("public"))

app.use(cookieParser())

export const startServer = () => {
  const port = Number(process.env.PORT) || 8000;

  app.listen(port, () => {
    console.log(`Server is running at port: ${port}`);
  });
};

