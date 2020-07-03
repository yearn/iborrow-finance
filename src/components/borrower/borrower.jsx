import React, { Component } from "react";
import { withStyles } from '@material-ui/core/styles';
import {
  Typography,
  TextField,
  InputAdornment,
  Button
} from '@material-ui/core'
import { colors } from '../../theme'

import Loader from '../loader'
import Snackbar from '../snackbar'

import {
  ERROR,
  CONFIGURE_RETURNED,
  DEPOSIT_VAULT,
  DEPOSIT_VAULT_RETURNED,
  WITHDRAW_VAULT,
  WITHDRAW_VAULT_RETURNED,
  GET_BALANCES,
  BALANCES_RETURNED,
  DEPLOY_VAULT,
  DEPLOY_VAULT_RETURNED,
  GET_VAULTS,
  VAULTS_RETURNED
} from '../../constants'

import Store from "../../store";
const dispatcher = Store.dispatcher
const emitter = Store.emitter
const store = Store.store

const styles = theme => ({
  root: {
    padding: '60px',
    width: '1200px'
  },
  addressContainer: {
    background: colors.white,
    borderRadius: '50px',
    padding: '30px 42px',
    border: '1px solid rgba(25, 101, 233, 0.5)',
    flex: 1,
    marginBottom: '40px',
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between'
  },
  container: {
    background: colors.white,
    borderRadius: '50px',
    padding: '30px 42px',
    flex: 1,
    marginBottom: '40px',
    border: '1px solid rgba(25, 101, 233, 0.5)',
  },
  between: {
    width: '40px'
  },
  totalsContainer: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  grey: {
    color: colors.darkGray
  },
  half: {
    display: 'flex'
  },
  actionInput: {
    padding: '0px 0px 12px 0px',
    fontSize: '0.5rem'
  },
  inputAdornment: {
    fontWeight: '600',
    fontSize: '1.5rem'
  },
  assetIcon: {
    display: 'inline-block',
    verticalAlign: 'middle',
    borderRadius: '25px',
    background: '#dedede',
    height: '30px',
    width: '30px',
    textAlign: 'center',
    marginRight: '16px'
  },
  balances: {
    width: '100%',
    textAlign: 'right',
    paddingRight: '20px',
    cursor: 'pointer'
  },
  title: {
    paddingRight: '24px'
  },
  valContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  actionButton: {
    marginTop: '20px',
    height: '47px'
  },
  deployVaultContainer: {

  },
  heading: {
    paddingBottom: '20px'
  },
  online: {
    border: '7px solid '+colors.green,
    borderRadius: '7px'
  },
  offline: {
    border: '7px solid '+colors.red,
    borderRadius: '7px'
  },
  walletAddress: {
    padding: '0px 12px'
  },
  walletTitle: {
    flex: 1,
    color: colors.darkGray
  }
});

class Borrower extends Component {

  state = {
    loading: (store.getStore('assets') == null || store.getStore('assets').length == 0),
    snackbarType: null,
    snackbarMessage: null,
    assets: store.getStore('assets').filter((asset) => { return (asset.balance > 0 || asset.vaultBalance > 0) }),
    vaults: store.getStore('vaults'),
    vault: store.getStore('vault'),
    account: store.getStore('account')
  };

  componentWillMount() {
    emitter.on(BALANCES_RETURNED, this.balancesReturned);
    emitter.on(VAULTS_RETURNED, this.vaultsReturned);
    emitter.on(CONFIGURE_RETURNED, this.configureReturned);
    emitter.on(ERROR, this.errorReturned);
  };

  componentWillUnmount() {
    emitter.removeListener(BALANCES_RETURNED, this.balancesReturned);
    emitter.removeListener(VAULTS_RETURNED, this.vaultsReturned);
    emitter.removeListener(CONFIGURE_RETURNED, this.configureReturned);
    emitter.removeListener(ERROR, this.errorReturned);
  };

  configureReturned = () => {
    dispatcher.dispatch({ type: GET_VAULTS, content: {} })
  }

  errorReturned = (error) => {
    const snackbarObj = { snackbarMessage: null, snackbarType: null }
    this.setState(snackbarObj)
    this.setState({ loading: false })
    const that = this
    setTimeout(() => {
      const snackbarObj = { snackbarMessage: error.toString(), snackbarType: 'Error' }
      that.setState(snackbarObj)
    })
  };

  balancesReturned = () => {
    // this.setState({ assets: store.getStore('assets').filter((asset) => { return (asset.balance > 0 || asset.vaultBalance > 0) }), loading: false })
  }

  vaultsReturned = () => {
    this.setState({
      loading: false,
      vault: store.getStore('vault'),
      vaults: store.getStore('vaults')
    })

    dispatcher.dispatch({ type: GET_BALANCES, content: {} })
  }

  render() {
    const {
      classes
    } = this.props

    const {
      loading,
      vaults,
      vault,
      account,
      snackbarMessage
    } = this.state

    var vaultAddr = null;
    if (vault && vault.address) {
      vaultAddr = vault.address.substring(0,6)+'...'+vault.address.substring(vault.address.length-4,vault.address.length)
    }

    var address = null;
    if (account && account.address) {
      address = account.address.substring(0,6)+'...'+account.address.substring(account.address.length-4,account.address.length)
    }

    return (
      <div className={ classes.root }>
        <div className={ classes.half }>
          <div className={ classes.addressContainer }>
            <Typography variant='h3' className={ classes.walletTitle } >Wallet</Typography>
            <Typography variant='h4' className={ classes.walletAddress } >{ address ? address : 'Not connected' }</Typography>
            { address != null && <div className={ classes.online }></div> }
            { address == null && <div className={ classes.offline }></div> }
          </div>
          <div className={ classes.between }>
          </div>
          <div className={ classes.addressContainer }>
            <Typography variant='h3' className={ classes.walletTitle } >Vault</Typography>
            <Typography variant='h4' className={ classes.walletAddress } >{ vaultAddr ? vaultAddr : 'Not connected' }</Typography>
            { vaultAddr != null && <div className={ classes.online }></div> }
            { vaultAddr == null && <div className={ classes.offline }></div> }
          </div>
        </div>
        <div className={ classes.container }>
          <div className={ classes.totalsContainer }>
            <div>
              <Typography variant='h3' className={ classes.grey }>Total Collateral</Typography>
              <Typography variant='h2'>$ { vault && vault.totalCollateralUSD ? (vault.totalCollateralUSD/(10**26)).toFixed(2) : '0.00' }</Typography>
            </div>
            <div>
              <Typography variant='h3' className={ classes.grey }>Total Liquidity</Typography>
              <Typography variant='h2'>$ { vault && vault.totalLiquidityUSD ? (vault.totalLiquidityUSD/(10**26)).toFixed(2) : '0.00' }</Typography>
            </div>
            <div>
              <Typography variant='h3' className={ classes.grey }>Total Borrowed</Typography>
              <Typography variant='h2'>$ { vault && vault.totalBorrowsUSD ? (vault.totalBorrowsUSD/(10**26)).toFixed(2) : '0.00' }</Typography>
            </div>
          </div>
        </div>
        { loading && <Loader /> }
        { snackbarMessage && this.renderSnackbar() }
      </div>
    )
  };

  renderSnackbar = () => {
    var {
      snackbarType,
      snackbarMessage
    } = this.state
    return <Snackbar type={ snackbarType } message={ snackbarMessage } open={true}/>
  };

  onChange = (event) => {
    let val = []
    val[event.target.id] = event.target.value
    this.setState(val)
  }
}

export default withStyles(styles)(Borrower);
