import React from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MyBorrowings from "./pages/MyBorrowings";
import SearchBooks from "./pages/SearchBooks";
import History from "./pages/History";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Feedback from "./pages/Feedback";
import NewBookRequest from "./pages/NewBookRequest";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";

export default function Root(props: any) {
  return (
    <Router basename="/dashboard">
      <Layout>
        <Switch>
          <Route exact path="/" component={Dashboard} />
          <Route path="/search" component={SearchBooks} />
          <Route path="/borrowings" component={MyBorrowings} />
          <Route path="/history" component={History} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/profile" component={Profile} />
          <Route path="/feedback" component={Feedback} />
          <Route path="/newbookrequest" component={NewBookRequest} />
        </Switch>
      </Layout>
    </Router>
  );
}
