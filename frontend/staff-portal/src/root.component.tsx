import React from "react";
import { BrowserRouter,Route,Switch,Redirect } from "react-router-dom";
import { ThemeProvider,createTheme } from "@mui/material";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Checkout from "./pages/Checkout";
import Checkin from "./pages/Checkin";
import Renewals from "./pages/Renewals";
import BookManagement from "./pages/BookManagement";
import AuthorManagement from "./pages/AuthorManagement";
import MemberManagement from "./pages/MemberManagement";
import LibrarianManagement from "./pages/LibrarianManagement";
import Feedback from "./pages/Feedback";
import NewBookRequests from "./pages/NewBookRequests";

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

export default function Root() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter basename="/staff">
        <Layout>
          <Switch>
            <Route exact path="/" component={Dashboard} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/checkin" component={Checkin} />
            <Route path="/renewals" component={Renewals} />
            <Route path="/books" component={BookManagement} />
            <Route path="/authors" component={AuthorManagement} />
            <Route path="/members" component={MemberManagement} />
            <Route path="/librarians" component={LibrarianManagement} />
            <Route path="/feedback" component={Feedback} />
            <Route path="/newbookrequests" component={NewBookRequests} />
            <Route path="*">
              <Redirect to="/" />
            </Route>
          </Switch>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}