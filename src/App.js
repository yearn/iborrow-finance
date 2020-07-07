import React, { Component } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';

import theme from './theme';

import Header from './components/header';
import Collateral from './components/collateral';
import Borrowing from './components/borrowing';
import Borrower from './components/borrower';
import Account from './components/account';
import Home from './components/home';

import {
  CONNECTION_CONNECTED,
  CONNECTION_DISCONNECTED,
  CONFIGURE,
  CONFIGURE_RETURNED,
  GET_VAULTS,
  VAULTS_RETURNED,
  GET_BALANCES,
  GET_BORROWER_VAULTS,
} from './constants'

import Store from "./store";
const emitter = Store.emitter
const dispatcher = Store.dispatcher
const store = Store.store

class App extends Component {
  state = {
    account: null,
    headerValue: null
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
    emitter.on(CONFIGURE_RETURNED, this.configureReturned);
    emitter.on(VAULTS_RETURNED, this.vaultsReturned);
  }

  componentWillUnmount() {
    emitter.removeListener(CONNECTION_CONNECTED, this.connectionConnected);
    emitter.removeListener(CONNECTION_DISCONNECTED, this.connectionDisconnected);
    emitter.removeListener(CONFIGURE_RETURNED, this.configureReturned);
    emitter.removeListener(VAULTS_RETURNED, this.vaultsReturned);
  };

  configureReturned = () => {
    dispatcher.dispatch({ type: GET_VAULTS, content: {} })
    dispatcher.dispatch({ type: GET_BORROWER_VAULTS, content: {} })
  }

  vaultsReturned = () => {
    dispatcher.dispatch({ type: GET_BALANCES, content: {} })
  }

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
          {
            (account && headerValue == null) &&
            <Home setHeaderValue={ this.setHeaderValue } />

          }
          { (account && headerValue != null) &&
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Header setHeaderValue={ this.setHeaderValue } headerValue={ headerValue } />
              { headerValue === 0 && <Collateral /> }
              { headerValue === 1 && <Borrowing /> }
              { headerValue === 2 && <Borrower /> }
            </div>
          }
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
