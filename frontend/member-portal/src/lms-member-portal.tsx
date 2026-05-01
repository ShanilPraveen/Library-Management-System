import React from "react";
import ReactDOM from "react-dom";
import singleSpaReact from "single-spa-react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./theme";
import Root from "./root.component";

// Wrap Root with Material-UI theme
const WrappedRoot = (props: any) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Root {...props} />
  </ThemeProvider>
);

const lifecycles = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: WrappedRoot,
  errorBoundary(err, info, props) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <h1>Error in Member Portal</h1>
        <p>{err.message}</p>
        <pre>{err.stack}</pre>
      </div>
    );
  },
});

export const { bootstrap, mount, unmount } = lifecycles;
