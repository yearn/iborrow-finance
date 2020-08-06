import React, { Component } from "react";
import { withStyles } from '@material-ui/core/styles';
import {
  Typography,
  TextField,
  Button,
  InputAdornment,
  MenuItem
} from '@material-ui/core';
import { colors } from '../../theme'

import {
  ERROR,
  BORROW,
  BORROW_RETURNED,
  REPAY,
  REPAY_RETURNED,
} from '../../constants'

import Store from "../../store";
const emitter = Store.emitter
const dispatcher = Store.dispatcher
const store = Store.store

const styles = theme => ({
  root: {
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
    paddingBottom: '12px'
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
  },
  inputSection: {
    flex: 1
  },
  assetSelectMenu: {
    padding: '15px 15px 15px 20px',
    minWidth: '200px',
    display: 'flex'
  },
  assetSelectIcon: {
    display: 'inline-block',
    verticalAlign: 'middle',
    borderRadius: '25px',
    background: '#dedede',
    height: '30px',
    width: '30px',
    textAlign: 'center',
    cursor: 'pointer'
  },
  assetSelectIconName: {
    paddingLeft: '10px',
    display: 'inline-block',
    verticalAlign: 'middle',
    flex: 1
  },
  assetSelectBalance: {

  },
  amountTitle: {
    paddingLeft: '20px',
  },
});

class Vault extends Component {

  constructor() {
    super()

    this.state = {
      amount: '',
      amountError: false,
      repayAmount: '',
      repayAmountError: false,
      borrow: null,
      repay: null,
      account: store.getStore('account')
    }
  }

  componentWillMount() {
    emitter.on(BORROW_RETURNED, this.borrowReturned);
    emitter.on(REPAY_RETURNED, this.repayReturned);
    emitter.on(ERROR, this.errorReturned);
  }

  componentWillUnmount() {
    emitter.removeListener(BORROW_RETURNED, this.borrowReturned);
    emitter.removeListener(REPAY_RETURNED, this.repayReturned);
    emitter.removeListener(ERROR, this.errorReturned);
  };

  borrowReturned = () => {
    this.setState({ loading: false, amount: '' })
    this.props.stopLoading()
  };

  repayReturned = (txHash) => {
    this.setState({ loading: false, repayAmount: '' })
    this.props.stopLoading()
  };

  errorReturned = (error) => {
    this.setState({ loading: false })
    this.props.stopLoading()
  };

  render() {
    const { classes, vault } = this.props;
    const {
      account,
      amount,
      amountError,
      repayAmount,
      repayAmountError,
      loading
    } = this.state

    return (<div className={ classes.root }>
      <div className={ classes.container }>
        <Typography variant='h3' className={ `${classes.grey} ${classes.heading}` }>{ vault.address }</Typography>
        <Typography variant='h4' className={ `${classes.heading}` }>Current borrowing limit: { vault.borrowSymbol === '$' ? vault.borrowSymbol : '' } { vault.limit.toFixed(4) } { vault.borrowSymbol !== '$' ? vault.borrowSymbol : '' }</Typography>
        <div className={ classes.half }>
          <div className={ classes.inputSection }>
            <div className={ classes.valContainer }>
              <div className={ classes.amountTitle }>
                <Typography variant='h4'>Asset to borrow</Typography>
              </div>
              { this.renderAssetSelect('borrow') }
            </div>
            <div className={ classes.valContainer }>
              <div className={ classes.amountTitle }>
                <Typography variant='h4'>Borrow Amount</Typography>
              </div>
              <TextField
                fullWidth
                disabled={ loading }
                className={ classes.actionInput }
                id={ 'amount' }
                value={ amount }
                error={ amountError }
                onChange={ this.onChange }
                placeholder="0.0000"
                variant="outlined"
                InputProps={{
                  startAdornment: (vault.borrowSymbol === '$' ? <InputAdornment position="end" className={ classes.inputAdornment }><Typography variant='h3' className={ '' }>{ vault.borrowSymbol }</Typography></InputAdornment> : null),
                  endAdornment: (vault.borrowSymbol !== '$' ? <InputAdornment position="end" className={ classes.inputAdornment }><Typography variant='h3' className={ '' }>{ vault.borrowSymbol }</Typography></InputAdornment> : null),
                }}
              />
            </div>
            <Button
              className={ classes.actionButton }
              variant="outlined"
              color="primary"
              disabled={ loading }
              onClick={ this.onBorrow }
              fullWidth
              >
              <Typography className={ classes.buttonText } variant={ 'h5'} color='secondary'>Borrow</Typography>
            </Button>
          </div>
          <div className={ classes.between }>
          </div>
          <div className={ classes.inputSection }>
            <div className={ classes.valContainer }>
              <div className={ classes.amountTitle }>
                <Typography variant='h4'>Asset to repay</Typography>
              </div>
              { this.renderAssetSelect('repay') }
            </div>
            <div className={ classes.valContainer }>
                <div className={ classes.amountTitle }>
                  <Typography variant='h4'>Repay Amount</Typography>
                </div>
                <TextField
                  fullWidth
                  disabled={ loading }
                  className={ classes.actionInput }
                  id={ 'repayAmount' }
                  value={ repayAmount }
                  error={ repayAmountError }
                  onChange={ this.onChange }
                  placeholder="0.0000"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (vault.borrowSymbol === '$' ? <InputAdornment position="end" className={ classes.inputAdornment }><Typography variant='h3' className={ '' }>{ vault.borrowSymbol }</Typography></InputAdornment> : null),
                    endAdornment: (vault.borrowSymbol !== '$' ? <InputAdornment position="end" className={ classes.inputAdornment }><Typography variant='h3' className={ '' }>{ vault.borrowSymbol }</Typography></InputAdornment> : null),
                  }}
                />
            </div>
            <Button
              className={ classes.actionButton }
              variant="outlined"
              color="primary"
              disabled={ loading }
              onClick={ this.onRepay }
              fullWidth
              >
              <Typography className={ classes.buttonText } variant={ 'h5'} color='secondary'>Repay</Typography>
            </Button>
          </div>
        </div>
      </div>
    </div>)
  };

  renderAssetSelect = (id) => {
    const { loading } = this.state
    const { classes, assets, vault } = this.props

    return (
      <TextField
        id={ id }
        name={ id }
        select
        value={ this.state[id] }
        onChange={ this.onSelectChange }
        SelectProps={{
          native: false,
        }}
        variant="outlined"
        fullWidth
        disabled={ loading }
        className={ classes.assetSelectRoot }
      >
        { assets ? assets.filter((asset) => {
          if( vault.borrowAsset !== '0x0000000000000000000000000000000000000000' ) {
            return asset.reserve === vault.borrowAsset
          } else {
            return true
          }

        }).map(this.renderAssetOption) : null }
      </TextField>
    )
  }

  renderAssetOption = (option) => {
    const { classes } = this.props


    let assetImage = ''
    try {
      assetImage = require('../../assets/'+option.id+'-logo.png')
    } catch (e) {
      assetImage = require('../../assets/aave-logo.png')
    }

    return (
      <MenuItem key={option.id} value={option.reserve_symbol} className={ classes.assetSelectMenu }>
        <React.Fragment>
          <div className={ classes.assetSelectIcon }>
            <img
              alt=""
              src={ assetImage }
              height="30px"
            />
          </div>
          <div className={ classes.assetSelectIconName }>
            <Typography variant='h4'>{ option.reserve_symbol }</Typography>
          </div>
          <div className={ classes.assetSelectBalance }>
            <Typography variant='h4' className={ classes.grey }>{ option.reserve_balance ? option.reserve_balance.toFixed(4) : '0.0000' } { option.reserve_symbol }</Typography>
          </div>
        </React.Fragment>
      </MenuItem>
    )
  }

  onSelectChange = (event) => {
    let val = []
    val[event.target.name] = event.target.value
    this.setState(val)
  }

  onChange = (event) => {
    let val = []
    val[event.target.id] = event.target.value
    this.setState(val)
  }

  inputKeyDown = (event) => {
    if (event.which === 13) {
      this.onInvest();
    }
  }

  onBorrow = () => {
    this.setState({ amountError: false, borrowError: false })

    const { amount, borrow } = this.state
    const { vault, startLoading, assets } = this.props

    if(!amount || isNaN(amount) || amount <= 0) {
      this.setState({ amountError: true })
      return false
    }

    let borrowReserve = assets.filter((asset) => { return asset.reserve_symbol === borrow })

    if(borrowReserve.length < 1) {
      this.setState({ borrowError: true })
      return false
    } else {
      borrowReserve = borrowReserve[0]
    }

    this.setState({ loading: true })
    startLoading()
    dispatcher.dispatch({ type: BORROW, content: { amount: amount, vault: vault, asset: borrowReserve } })
  }

  onRepay = () => {
    this.setState({ repayAmountError: false, repayError: false })

    const { repayAmount, repay } = this.state
    const { vault, startLoading, assets  } = this.props

    if(!repayAmount || isNaN(repayAmount) || repayAmount <= 0) {
      this.setState({ repayAmountError: true })
      return false
    }

    let repayReserve = assets.filter((asset) => { return asset.reserve_symbol === repay })

    if(repayReserve.length < 1) {
      this.setState({ repayError: true })
      return false
    } else {
      repayReserve = repayReserve[0]
    }

    this.setState({ loading: true })
    startLoading()

    dispatcher.dispatch({ type: REPAY, content: { amount: repayAmount, vault: vault, asset: repayReserve } })
  }
}

export default withStyles(styles)(Vault);
