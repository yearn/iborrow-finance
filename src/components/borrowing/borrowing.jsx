import React, { Component } from "react";
import { withStyles } from '@material-ui/core/styles';
import {
  Typography,
  TextField,
  InputAdornment,
  Button
} from '@material-ui/core'
import { colors } from '../../theme'
import SearchIcon from '@material-ui/icons/Search';

import Loader from '../loader'
import Snackbar from '../snackbar'

import {
  ERROR,
  CONFIGURE_RETURNED,
  GET_VAULTS,
  GET_BALANCES,
  VAULTS_RETURNED,
  ADD_BORROWER,
  ADD_BORROWER_RETURNED,
  SEARCH_BORROWER,
  SEARCH_BORROWER_RETURNED,
  INCREASE_LIMITS,
  INCREASE_LIMITS_RETURNED,
  DECREASE_LIMITS,
  DECREASE_LIMITS_RETURNED
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
    fontSize: '1.5rem',
    marginRight: '12px'
  },
  emptyInputAdornment: {
    marginRight: '0px'
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
  amountTitle: {
    paddingLeft: '20px',
  },
  title: {
    paddingRight: '24px'
  },
  amountContainer: {
    display: 'flex'
  },
  valContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  actionButton: {
    marginTop: '20px',
    height: '47px'
  },
  searchButton: {
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
  },
  borrower: {
    display: 'flex',
    flexDirection: 'column'
  },
  borrowerInfo: {
    display: 'flex',
    padding: '6px 12px'
  },
  borrowerTitle: {
    width: '300px',
    color: colors.darkGray
  },
  borrowerValue: {
    flex: '1'
  }
});

class Borrowing extends Component {

  state = {
    loading: (store.getStore('assets') == null || store.getStore('assets').length == 0),
    snackbarType: null,
    snackbarMessage: null,
    vaults: store.getStore('vaults'),
    vault: store.getStore('vault'),
    account: store.getStore('account'),
    foundBorrower: null,
  };

  componentWillMount() {
    emitter.on(VAULTS_RETURNED, this.vaultsReturned);
    emitter.on(CONFIGURE_RETURNED, this.configureReturned);
    emitter.on(ADD_BORROWER_RETURNED, this.addBorrowerReturned);
    emitter.on(SEARCH_BORROWER_RETURNED, this.searchReturned);
    emitter.on(INCREASE_LIMITS_RETURNED, this.increaseLimitsReturned);
    emitter.on(DECREASE_LIMITS_RETURNED, this.increaseLimitsReturned);
    emitter.on(ERROR, this.errorReturned);
  };

  componentWillUnmount() {
    emitter.removeListener(VAULTS_RETURNED, this.vaultsReturned);
    emitter.removeListener(CONFIGURE_RETURNED, this.configureReturned);
    emitter.removeListener(ADD_BORROWER_RETURNED, this.addBorrowerReturned);
    emitter.removeListener(SEARCH_BORROWER_RETURNED, this.searchReturned);
    emitter.removeListener(INCREASE_LIMITS_RETURNED, this.increaseLimitsReturned);
    emitter.removeListener(DECREASE_LIMITS_RETURNED, this.increaseLimitsReturned);
    emitter.removeListener(ERROR, this.errorReturned);
  };

  increaseLimitsReturned = (txHash) => {
    dispatcher.dispatch({ type: SEARCH_BORROWER, content: { borrower: this.state.foundBorrower.address } })

    const that = this
    setTimeout(() => {
      const snackbarObj = { snackbarMessage: txHash, snackbarType: 'Hash' }
      that.setState(snackbarObj)
    })
  }

  searchReturned = (borrowerLimits) => {
    this.setState({ loading: false, foundBorrower: { address: this.state.searchBorrower, limit: borrowerLimits } })
  }

  addBorrowerReturned = (txHash) => {
    dispatcher.dispatch({ type: GET_VAULTS, content: {} })
    this.setState({ loading: false })

    const that = this
    setTimeout(() => {
      const snackbarObj = { snackbarMessage: txHash, snackbarType: 'Hash' }
      that.setState(snackbarObj)
    })
  }

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
      snackbarMessage,
      amount,
      amountError,
      borrower,
      borrowerError,
      searchBorrower,
      searchBorrowerError,
      foundBorrower,
      manageAmount,
      manageAmountError,
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
              <Typography variant='h2'>$ { vault && vault.availableBorrowsUSD ? (vault.availableBorrowsUSD/(10**26)).toFixed(2) : '0.00' }</Typography>
            </div>
            <div>
              <Typography variant='h3' className={ classes.grey }>Total Borrowed</Typography>
              <Typography variant='h2'>$ { vault && vault.totalBorrowsUSD ? (vault.totalBorrowsUSD/(10**26)).toFixed(2) : '0.00' }</Typography>
            </div>
          </div>
        </div>
        <div className={ classes.container }>
          <Typography variant='h3' className={ `${classes.grey} ${classes.heading}` }>Add a borrower</Typography>
          <div className={ classes.amountContainer }>
            <div className={ classes.valContainer }>
              <div className={ classes.amountTitle }>
                <Typography variant='h4'>Borrower</Typography>
              </div>
              <div>
                <TextField
                  fullWidth
                  disabled={ loading }
                  className={ classes.actionInput }
                  id={ 'borrower' }
                  value={ borrower }
                  error={ borrowerError }
                  onChange={ this.onChange }
                  placeholder="0x....."
                  variant="outlined"
                  InputProps={{
                    startAdornment: <InputAdornment position="end" className={ classes.emptyInputAdornment }></InputAdornment>,
                  }}
                />
              </div>
            </div>
            <div className={ classes.between }>
            </div>
            <div className={ classes.valContainer }>
              <div className={ classes.balances }>
                <Typography variant='h4' onClick={ () => { this.setAmount('amount', (vault && vault.availableBorrowsUSD ? vault.availableBorrowsUSD/(10**26) : 0)) } } className={ classes.value } noWrap>{ 'Balance: $ '+ (vault && vault.availableBorrowsUSD ? (vault.availableBorrowsUSD/(10**26)).toFixed(2) : '0.00') } </Typography>
              </div>
              <div>
                <TextField
                  fullWidth
                  disabled={ loading }
                  className={ classes.actionInput }
                  id={ 'amount' }
                  value={ amount }
                  error={ amountError }
                  onChange={ this.onChange }
                  placeholder="0.00"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <InputAdornment position="end" className={ classes.inputAdornment }><Typography variant='h3' className={ '' }>$</Typography></InputAdornment>,
                  }}
                />
              </div>
            </div>
          </div>
          <Button
            className={ classes.actionButton }
            variant="outlined"
            color="primary"
            disabled={ loading }
            onClick={ this.onAddBorrower }
            fullWidth
            >
            <Typography className={ classes.buttonText } variant={ 'h5'} color='secondary'>Add borrower</Typography>
          </Button>
        </div>
        <div className={ classes.container }>
          <Typography variant='h3' className={ `${classes.grey} ${classes.heading}` }>Manage borrower limits</Typography>
          <div className={ classes.amountContainer }>
            <TextField
              fullWidth
              disabled={ loading }
              className={ classes.actionInput }
              id={ 'searchBorrower' }
              value={ searchBorrower }
              error={ searchBorrowerError }
              onChange={ this.onChange }
              placeholder="0x....."
              variant="outlined"
              onKeyDown= { this.onSearchKeyDown }
              InputProps={{
                startAdornment: <InputAdornment position="end" className={ classes.inputAdornment }><SearchIcon /></InputAdornment>,
              }}
            />
            <div className={ classes.between }>
            </div>
            <Button
              className={ classes.searchButton }
              variant="outlined"
              color="primary"
              disabled={ loading }
              onClick={ this.onSearch }
              >
              <Typography className={ classes.buttonText } variant={ 'h5'} color='secondary'>Search</Typography>
            </Button>
          </div>
          { foundBorrower && (
            <div className={ classes.borrower }>
              <Typography variant='h3' className={ `${classes.grey} ${classes.heading}` }>Search Result</Typography>
              <div className={ classes.borrowerInfo }>
                <Typography variant={ 'h4' } className={ classes.borrowerTitle }>Address</Typography>
                <Typography variant={ 'h4' } className={ classes.borrowerValue }>{ foundBorrower ? foundBorrower.address : 'N/A' }</Typography>
              </div>
              <div className={ classes.borrowerInfo }>
                <Typography variant={ 'h4' } className={ classes.borrowerTitle }>Current Limit</Typography>
                <Typography variant={ 'h4' } className={ classes.borrowerValue }>$ { (foundBorrower ? foundBorrower.limit : 0).toFixed(2) }</Typography>
              </div>
              <div className={ classes.borrowerInfo }>
                <TextField
                  fullWidth
                  disabled={ loading }
                  className={ classes.actionInput }
                  id={ 'manageAmount' }
                  value={ manageAmount }
                  error={ manageAmountError }
                  onChange={ this.onChange }
                  placeholder={ foundBorrower.limit }
                  variant="outlined"
                  InputProps={{
                    startAdornment: <InputAdornment position="end" className={ classes.inputAdornment }><Typography variant='h3' className={ '' }>$</Typography></InputAdornment>,
                  }}
                />
                <div className={ classes.between }>
                </div>
                <Button
                  className={ classes.searchButton }
                  variant="outlined"
                  color="primary"
                  disabled={ loading }
                  onClick={ this.onManageLimit }
                  fullWidth
                  >
                  <Typography className={ classes.buttonText } variant={ 'h5'} color='secondary'>Set new limit</Typography>
                </Button>
              </div>
            </div>
          ) }
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

  setAmount = (id, balance) => {
    const bal = (Math.floor((balance === '' ? '0' : balance)*10000)/10000).toFixed(4)
    let val = []
    val[id] = bal
    this.setState(val)
  }

  onAddBorrower = () => {
    this.setState({ borrowerError: false, amountError: false })
    const {
      borrower,
      amount
    } = this.state

    let error = false

    if(!borrower || borrower === "") {
      this.setState({ borrowerError: 'Invalid' })
      error = true
    }

    if(!amount || amount === "") {
      this.setState({ amountError: 'Invalid' })
      error = true
    }

    if(!error) {
      this.setState({ loading: true })
      dispatcher.dispatch({ type: ADD_BORROWER, content: { borrower: borrower, amount: amount } })
    }
  }

  onSearchKeyDown = (event) => {
    if (event.which === 13) {
      this.onSearch();
    }
  }

  onSearch = () => {
    this.setState({ searchBorrowerError: false })
    const {
      searchBorrower
    } = this.state

    let error = false

    if(!searchBorrower || searchBorrower === "") {
      this.setState({ searchBorrowerError: 'Invalid' })
      error = true
    }

    if(!error) {
      this.setState({ loading: true })
      dispatcher.dispatch({ type: SEARCH_BORROWER, content: { borrower: searchBorrower } })
    }
  }

  onManageLimit = () => {
    this.setState({ manageAmountError: false })
    const { manageAmount, foundBorrower } = this.state

    let error = false

    if(!manageAmount || manageAmount === "") {
      this.setState({ manageAmountError: 'Invalid' })
      error = true
    }

    if(!error) {

      const limit = parseFloat(foundBorrower.limit)
      const newLimit = parseFloat(manageAmount)

      if(limit == newLimit) {
        this.setState({ manageAmountError: 'Invalid' })
        return false
      }

      if(limit < newLimit) {
        let adjustLimit = (newLimit - limit).toFixed(4)
        this.setState({ loading: true })
        dispatcher.dispatch({ type: INCREASE_LIMITS, content: { borrower: foundBorrower.address, amount: adjustLimit } })
      }

      if(limit > newLimit) {
        let adjustLimit = (limit - newLimit).toFixed(4)
        this.setState({ loading: true })
        dispatcher.dispatch({ type: DECREASE_LIMITS, content: { borrower: foundBorrower.address, amount: adjustLimit } })
      }
    }
  }
}

export default withStyles(styles)(Borrowing);
