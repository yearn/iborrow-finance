import React, { Component } from "react";
import { withStyles } from '@material-ui/core/styles';
import {
  Typography,
  Button,
} from '@material-ui/core';
import { colors } from '../../theme'

import UnlockModal from '../unlock/unlockModal.jsx'
import RefreshIcon from '@material-ui/icons/Refresh';

import {
  ERROR,
  GET_BALANCES,
  BALANCES_RETURNED,
  GET_VAULTS,
  VAULTS_RETURNED,
  CONNECTION_DISCONNECTED,
  CONFIGURE,
} from '../../constants'

import Store from "../../store";
const emitter = Store.emitter
const dispatcher = Store.dispatcher
const store = Store.store

const styles = theme => ({
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: colors.blue,
    minHeight: '100vh',
    padding: '36px 24px'
  },
  connectHeading: {
    maxWidth: '300px',
    textAlign: 'center',
    color: colors.white
  },
  connectContainer: {
    padding: '20px'
  },
  actionButton: {
    color: colors.white,
    borderColor: colors.white
  },
  notConnectedRoot: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectedRoot: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: '100%'
  },
  address: {
    color: colors.white,
    width: '100%',
    paddingBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between'
  },
  balances: {
    color: colors.white,
    width: '100%',
    padding: '12px'
  },
  balanceContainer: {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between'
  },
  accountHeading: {
    paddingBottom: '6px'
  },
  icon: {
    cursor: 'pointer'
  },
  disclaimer: {
    padding: '12px',
    border: '1px solid '+colors.white,
    borderRadius: '0.75rem',
    marginBottom: '24px',
    fontWeight: 1,
    color: colors.white
  }
});

class Account extends Component {

  constructor(props) {
    super()

    const account = store.getStore('account')

    this.state = {
      account: account,
      assets: store.getStore('assets'),
      modalOpen: false,
    }
  }
  componentWillMount() {
    emitter.on(ERROR, this.errorReturned);
    emitter.on(BALANCES_RETURNED, this.balancesReturned);
    emitter.on(VAULTS_RETURNED, this.vaultsReturned);
    emitter.on(CONNECTION_DISCONNECTED, this.connectionDisconnected);
  }

  componentWillUnmount() {
    emitter.removeListener(ERROR, this.errorReturned);
    emitter.removeListener(BALANCES_RETURNED, this.balancesReturned);
    emitter.removeListener(VAULTS_RETURNED, this.vaultsReturned);
    emitter.removeListener(CONNECTION_DISCONNECTED, this.connectionDisconnected);
  };

  refresh = () => {
  }

  vaultsReturned = () => {
  };

  balancesReturned = (balances) => {
    this.setState({ assets: store.getStore('assets') })
  };

  connectionDisconnected = () => {
    this.setState({ account: store.getStore('account') })
  }

  errorReturned = (error) => {
  };

  render() {
    const { classes } = this.props;
    const {
      account,
      modalOpen,
    } = this.state

    return (
      <div className={ classes.root }>
        { !account && this.renderNotConnected() }
        { (account && account.address) && this.renderConnected() }
        { modalOpen && this.renderModal() }
      </div>
    )
  };

  renderConnected = () => {
    const { classes } = this.props;
    const { account } = this.state;
    var address = null;
    if (account && account.address) {
      address = account.address.substring(0,6)+'...'+account.address.substring(account.address.length-4,account.address.length)
    }

    return (
      <div className={ classes.connectedRoot }>
        <div className={ classes.address }>
          <Typography variant='h3'>{ address }</Typography>
          <RefreshIcon className={ classes.icon } onClick={ this.refresh() } />
        </div>
        <div className={ classes.balances }>
          <Typography variant='h4' className={ classes.accountHeading }>Balances</Typography>
          { this.renderBalances() }
        </div>
      </div>
    )
  }

  renderBalances = () => {
    const { classes } = this.props;
    const { assets } = this.state;

    return assets.map((asset) => {
      return (
        <div className={ classes.balanceContainer }>
          <Typography variant='body1'>{ asset.name }</Typography>
          <Typography variant='body1'>{ asset.balance ? (Math.floor(asset.balance*10000)/10000).toFixed(4) : '0.0000' } { asset.symbol }</Typography>
        </div>
      )
    })
  }

  renderNotConnected = () => {
    const { classes } = this.props;

    return (
      <div className={ classes.notConnectedRoot }>
        <Typography variant={'h5'} className={ classes.disclaimer }>This project is in beta. Use at your own risk.</Typography>
        <div className={ classes.connectHeading }>
          <Typography variant='h3'>Connect your wallet to continue</Typography>
        </div>
        <div className={ classes.connectContainer }>
          <Button
            className={ classes.actionButton }
            variant="outlined"
            color="primary"
            onClick={ this.unlockClicked }
            >
            <Typography>Connect</Typography>
          </Button>
        </div>
      </div>
    )
  }

  renderModal = () => {
    return (
      <UnlockModal closeModal={ this.closeModal } modalOpen={ this.state.modalOpen } />
    )
  }

  unlockClicked = () => {
    this.setState({ modalOpen: true })
  }

  closeModal = () => {
    this.setState({ modalOpen: false })
  }
}

export default withStyles(styles)(Account);
