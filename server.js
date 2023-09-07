const Koa = require("koa");
const static = require("koa-static");

const app = new Koa();

app.use(static("./"));

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
