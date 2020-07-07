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
import Vault from './vault'

import {
  ERROR,
  CONFIGURE_RETURNED,
  GET_VAULTS,
  VAULTS_RETURNED,
  GET_BALANCES,
  BALANCES_RETURNED,
  GET_BORROWER_VAULTS,
  GET_BORROWER_VAULTS_RETURNED,
  BORROW_RETURNED,
  REPAY_RETURNED,
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
  invisContainer: {
    flex: 1,
    marginBottom: '40px',
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
    loading: (store.getStore('borrowerVaults') == null || store.getStore('borrowerVaults').length == 0),
    snackbarType: null,
    snackbarMessage: null,
    account: store.getStore('account'),
    borrowerVaults: store.getStore('borrowerVaults'),
    assets: store.getStore('assets')
  };

  componentWillMount() {
    emitter.on(GET_BORROWER_VAULTS_RETURNED, this.borrowerVaultsReturned);
    emitter.on(CONFIGURE_RETURNED, this.configureReturned);
    emitter.on(ERROR, this.errorReturned);
    emitter.on(VAULTS_RETURNED, this.vaultsReturned);
    emitter.on(BALANCES_RETURNED, this.balancesReturned);
    emitter.on(BORROW_RETURNED, this.borrowReturned);
    emitter.on(REPAY_RETURNED, this.repayReturned);
  };

  componentWillUnmount() {
    emitter.removeListener(GET_BORROWER_VAULTS_RETURNED, this.borrowerVaultsReturned);
    emitter.removeListener(CONFIGURE_RETURNED, this.configureReturned);
    emitter.removeListener(ERROR, this.errorReturned);
    emitter.removeListener(VAULTS_RETURNED, this.vaultsReturned);
    emitter.removeListener(BALANCES_RETURNED, this.balancesReturned);
    emitter.removeListener(BORROW_RETURNED, this.borrowReturned);
    emitter.removeListener(REPAY_RETURNED, this.repayReturned);
  };

  borrowReturned = (hash) => {
    dispatcher.dispatch({ type: GET_BORROWER_VAULTS, content: {} })
    const that = this
    setTimeout(() => {
      const snackbarObj = { snackbarMessage: hash, snackbarType: 'Hash' }
      that.setState(snackbarObj)
    })
  }

  repayReturned = (hash) => {
    dispatcher.dispatch({ type: GET_BORROWER_VAULTS, content: {} })
    const that = this
    setTimeout(() => {
      const snackbarObj = { snackbarMessage: hash, snackbarType: 'Hash' }
      that.setState(snackbarObj)
    })
  }

  configureReturned = () => {
    dispatcher.dispatch({ type: GET_VAULTS, content: {} })
    dispatcher.dispatch({ type: GET_BORROWER_VAULTS, content: {} })
  }

  vaultsReturned = () => {
    dispatcher.dispatch({ type: GET_BALANCES, content: {} })
  }

  balancesReturned = () => {
    this.setState({ assets: store.getStore('assets') })
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

  borrowerVaultsReturned = () => {
    this.setState({
      loading: false,
      borrowerVaults: store.getStore('borrowerVaults')
    })
  }

  render() {
    const {
      classes
    } = this.props

    const {
      loading,
      account,
      snackbarMessage,
      borrowerVaults
    } = this.state

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
          <div className={ classes.invisContainer }>

          </div>
        </div>
        {
          (!borrowerVaults) &&
            <div className={ classes.container }>
              <div className={ classes.deployVaultContainer }>
                <Typography variant='h3' className={ classes.grey }>Loading your vaults...</Typography>
              </div>
            </div>
        }
        {
          (borrowerVaults && borrowerVaults.length === 0) &&
            <div className={ classes.container }>
              <div className={ classes.deployVaultContainer }>
                <Typography variant='h3' className={ classes.grey }>You have no vaults to borrow from</Typography>
              </div>
            </div>
        }
        {
          (borrowerVaults && borrowerVaults.length > 0) &&
            this.renderBorrowerVaults()
        }
        { loading && <Loader /> }
        { snackbarMessage && this.renderSnackbar() }
      </div>
    )
  };

  startLoading = () => {
    this.setState({ loading: true })
  }

  stopLoading = () => {
    this.setState({ loading: false })
  }

  renderSnackbar = () => {
    var {
      snackbarType,
      snackbarMessage
    } = this.state
    return <Snackbar type={ snackbarType } message={ snackbarMessage } open={true}/>
  };

  renderBorrowerVaults = () => {
    const { borrowerVaults, assets } = this.state

    return borrowerVaults.map((borrowerVault) => {
      return <Vault vault={ borrowerVault } assets={ assets } startLoading={ this.startLoading } stopLoading={ this.stopLoading } />
    })
  }
}

export default withStyles(styles)(Borrower);
