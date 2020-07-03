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
  GET_BALANCES,
  BALANCES_RETURNED,
  GET_VAULTS,
  VAULTS_RETURNED
} from '../../constants'

import Store from "../../store";
const dispatcher = Store.dispatcher
const emitter = Store.emitter
const store = Store.store

const styles = theme => ({
  root: {
    padding: '60px'
  },
  container: {
    background: colors.white,
    borderRadius: '50px',
    padding: '42px',
    flex: 1,
    marginBottom: '60px'
  },
  between: {
    width: '60px'
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

  }
});

class Borrowing extends Component {
  state = {
    loading: false,
    snackbarType: null,
    snackbarMessage: null,
    assets: store.getStore('assets'),
    vaults: store.getStore('vaults'),
    vault: store.getStore('vault')
  };

  componentWillMount() {
    emitter.on(BALANCES_RETURNED, this.balancesReturned);
    emitter.on(VAULTS_RETURNED, this.vaultsReturned);
    emitter.on(ERROR, this.errorReturned);
  };

  componentWillUnmount() {
    emitter.removeListener(BALANCES_RETURNED, this.balancesReturned);
    emitter.removeListener(VAULTS_RETURNED, this.vaultsReturned);
    emitter.removeListener(ERROR, this.errorReturned);
  };

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
    this.setState({ assets: store.getStore('assets'), loading: false })
  }

  vaultsReturned = () => {
    this.setState({
      vault: store.getStore('vault'),
      vaults: store.getStore('vaults')
    })
  }

  render() {
    const {
      classes
    } = this.props

    const {
      loading,
      vaults,
      vault,
      snackbarMessage
    } = this.state

    var vaultAddr = null;
    if (vault && vault.address) {
      vaultAddr = vault.address.substring(0,6)+'...'+vault.address.substring(vault.address.length-4,vault.address.length)
    }

    return (
      <div className={ classes.root }>
        <div className={ classes.container }>
          <div className={ classes.totalsContainer }>
            <div>
              <Typography variant='h3' className={ classes.grey }>Total Collateral</Typography>
              <Typography variant='h2'>$ { vault && vault.totalCollateralUSD ? (vault.totalCollateralUSD/(10**26)).toFixed(4) : '0.00' }</Typography>
            </div>
            <div>
              <Typography variant='h3' className={ classes.grey }>Total Liquidity</Typography>
              <Typography variant='h2'>$ { vault && vault.totalLiquidityUSD ? (vault.totalLiquidityUSD/(10**26)).toFixed(4) : '0.00' }</Typography>
            </div>
            <div>
              <Typography variant='h3' className={ classes.grey }>Vault Addr</Typography>
              <Typography variant='h2'>{ vaultAddr ? vaultAddr : 'Not open' }</Typography>
            </div>
          </div>
        </div>
        <div>

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

export default withStyles(styles)(Borrowing);
