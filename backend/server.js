const app = require("./src/app");
const ConnectDB = require("./src/config/db");
const {
  notFound,
  errorHandler,
  requestLogger,
} = require("./src/middleware/error.middleware");
const apiRouter = require("./src/routes");

const port = 5000;

app.use(requestLogger);
app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await ConnectDB();
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server started on port: ${port}`);
  });
};

startServer();
