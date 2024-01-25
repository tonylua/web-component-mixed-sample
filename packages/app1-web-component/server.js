const Koa = require("koa");
const static = require("koa-static");

const app = new Koa();
const port = 3000;

app.use(static("./"));
app.use(static("../app2-vue3/dist/"));
app.use(static("../app3-vue2/dist/"));
app.use(static("../app4-react/build/"));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
