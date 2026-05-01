const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");
const Dotenv = require("dotenv-webpack");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "lms",
    projectName: "auth-client",
    webpackConfigEnv,
    argv,
    outputSystemJS: true,
  });

  return merge(defaultConfig, {
    externals : [
      "react",
      "react-dom"],
    // modify the webpack config however you'd like to by adding to this object
    plugins:[
      new Dotenv({
        path: './.env',
        systemvars: true
      })
    ]
  });
};
