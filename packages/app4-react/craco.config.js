const path = require("path");

module.exports = {
  webpack: {
    configure: (config, { env, paths }) => {
      config.output = {
        filename: "react-weather-consumer.js",
        path: path.resolve(__dirname, "build"),
      };
      config.externals = {
        react: "React",
        "react-dom": "ReactDOM",
      };
      return config;
    },
  },
};
