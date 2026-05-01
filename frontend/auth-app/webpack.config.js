const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");
const webpack = require("webpack");
require("dotenv").config();

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "lms",
    projectName: "auth-app",
    webpackConfigEnv,
    argv,
    outputSystemJS: true,
  });

  return merge(defaultConfig, {
    plugins: [
      new webpack.DefinePlugin({
        'process.env.REACT_APP_COGNITO_USER_POOL_ID': JSON.stringify(process.env.REACT_APP_COGNITO_USER_POOL_ID),
        'process.env.REACT_APP_COGNITO_CLIENT_ID': JSON.stringify(process.env.REACT_APP_COGNITO_CLIENT_ID),
      }),
    ],
    externals: [
      "react", 
      "react-dom", 
      "@lms/auth-client" 
    ]
  });
};