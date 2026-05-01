import React from "react";
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import Login from "./pages/Login";
import SetNewPassword from "./pages/SetNewPassword";

export default function Root(props: any) {
  return (
    <Router basename="/">
      <Switch>
        <Route exact path="/login" component={Login} />
        <Route path="/set-new-password" component={SetNewPassword} />
        <Redirect from="/" to="/login" />
      </Switch>
    </Router>
  );
}