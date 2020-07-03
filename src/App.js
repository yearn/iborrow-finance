import React, { Component } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';

import theme from './theme';

import Header from './components/header';
import Collateral from './components/collateral';
import Borrowing from './components/borrowing';
import Account from './components/account';

import {
  CONNECTION_CONNECTED,
  CONNECTION_DISCONNECTED,
  CONFIGURE
} from './constants'

import Store from "./store";
const emitter = Store.emitter
const dispatcher = Store.dispatcher
const store = Store.store

class App extends Component {
  state = {
    account: null,
    headerValue: 0
  };

  setHeaderValue = (newValue) => {
    this.setState({ headerValue: newValue })
  };

  setAccount = (account) => {
    this.setState({ account: account })
  };

  componentWillMount() {
    emitter.on(CONNECTION_CONNECTED, this.connectionConnected);
    emitter.on(CONNECTION_DISCONNECTED, this.connectionDisconnected);
  }

  componentWillUnmount() {
    emitter.removeListener(CONNECTION_CONNECTED, this.connectionConnected);
    emitter.removeListener(CONNECTION_DISCONNECTED, this.connectionDisconnected);
  };

  connectionConnected = () => {
    this.setState({ account: store.getStore('account') })
    dispatcher.dispatch({ type: CONFIGURE, content: {} })
  };

  connectionDisconnected = () => {
    this.setState({ account: store.getStore('account') })
  }

  render() {

    const { headerValue, account } = this.state

    return (
      <MuiThemeProvider theme={ createMuiTheme(theme) }>
        <CssBaseline />
        <div style={
          {
            display: 'flex',
            flexDirection: 'row',
            minHeight: '100vh',
            justifyContent: 'center',
            background: "#f9fafb"
          }
        }>
          { !account &&
            <Account setAccount={ this.setAccount } />
          }
          { account &&
            <div style={{ flex: 1, maxWidth: '1200px' }}>
              <Header setHeaderValue={ this.setHeaderValue } />
              { headerValue === 0 && <Collateral /> }
              { headerValue === 1 && <Borrowing /> }
            </div>
          }
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
