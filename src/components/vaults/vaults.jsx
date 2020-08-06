import React, { Component } from "react";
import { withStyles } from '@material-ui/core/styles';
import {
  Typography,
  Button,
  CircularProgress,
  MenuItem,
  TextField
} from '@material-ui/core';
import { colors } from '../../theme'

import Loader from '../loader'

import CloseIcon from '@material-ui/icons/Close';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';

import {
  ERROR,
  VAULT_CHANGED,
  VAULTS_RETURNED,
  BALANCES_RETURNED,
  DEPLOY_VAULT
} from '../../constants'

import Store from "../../store";
const emitter = Store.emitter
const store = Store.store
const dispatcher = Store.dispatcher

const styles = theme => ({
  root: {
    flex: 1,
    height: 'auto',
    display: 'flex',
    position: 'relative'
  },
  contentContainer: {
    margin: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  cardContainer: {
    marginTop: '60px',
    minHeight: '260px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  unlockCard: {
    padding: '24px'
  },
  buttonText: {
    marginLeft: '12px',
    fontWeight: '700',
  },
  instruction: {
    maxWidth: '400px',
    marginBottom: '32px',
    marginTop: '32px'
  },
  actionButton: {
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '3rem',
    border: '1px solid #E1E1E1',
    fontWeight: 500,
    [theme.breakpoints.up('md')]: {
      padding: '15px',
    }
  },
  connect: {
    width: '100%'
  },
  closeIcon: {
    position: 'fixed',
    right: '12px',
    top: '12px',
    cursor: 'pointer'
  },
  grey: {
    color: colors.darkGray,
    width: '100%'
  },
  valContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  amountContainer: {
    paddingTop: '24px',
    display: 'flex',
    alignItems: 'flex-end'
  },
  amountTitle: {
    paddingLeft: '20px',
  },
  searchButton: {
    height: '47px',
    minWidth: '200px'
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
  between: {
    width: '40px'
  },
});

class Unlock extends Component {

  constructor(props) {
    super()

    this.state = {
      error: null,
      vaults: store.getStore('vaults'),
      currentVault: store.getStore('vault'),
      vaultCreateAssets: store.getStore('assets')
    }
  }

  componentWillMount() {
    emitter.on(ERROR, this.error);
    emitter.on(VAULTS_RETURNED, this.vaultsReturned);
    emitter.on(BALANCES_RETURNED, this.balancesReturned);
  };

  componentWillUnmount() {
    emitter.removeListener(ERROR, this.error);
    emitter.removeListener(VAULTS_RETURNED, this.vaultsReturned);
    emitter.removeListener(BALANCES_RETURNED, this.balancesReturned);
  };

  vaultsReturned = () => {
    this.setState({
      loading: false,
      currentVault: store.getStore('vault'),
      vaults: store.getStore('vaults')
    })
  }

  balancesReturned = () => {
    this.setState({
      vaultCreateAssets: store.getStore('assets'),
      loading: false
    })
  }

  error = (err) => {
    this.setState({ loading: false, error: err })
  };

  render() {
    const { classes, closeModal } = this.props;
    const { loading } = this.state

    return (
      <div className={ classes.root }>
        <div className={ classes.closeIcon } onClick={ closeModal }><CloseIcon /></div>
        <div className={ classes.contentContainer }>
          <Typography variant={ 'h3' } className={ classes.grey }>Your vaults</Typography>
          { this.renderVaults() }
          <Typography variant={ 'h3' } className={ classes.grey }>Create a new vaults</Typography>
          <div className={ classes.amountContainer }>
            <div className={ classes.valContainer }>
              <div className={ classes.amountTitle }>
                <Typography variant='h4'>Vault Asset</Typography>
              </div>
              { this.renderAssetSelect('borrowerAsset') }
            </div>
            <div className={ classes.between }>
            </div>
            <Button
              className={ classes.searchButton }
              variant="outlined"
              color="primary"
              disabled={ loading }
              onClick={ this.onDeployVault }
              >
              <Typography className={ classes.buttonText } variant={ 'h5'} color='secondary'>Create Vault</Typography>
            </Button>
          </div>
        </div>
        { loading && <Loader /> }
      </div>
    )
  };

  renderVaults = () => {
    const { vaults, loading, currentVault } = this.state

    if(!vaults || vaults.length === 0) {
      return <Typography varuant={ 'h3' }>No vaults returned</Typography>
    }

    return vaults.map((vault) => {

      const active = currentVault.address === vault.address

      return (
        <div key={vault.address} style={{ padding: '12px 0px', display: 'flex', justifyContent: 'space-between'  }}>
          <Button style={ {
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '50px',
              border: '1px solid rgba(25, 101, 133, 0.5)',
              fontWeight: 500,
              display: 'flex',
              justifyContent: 'space-between',
              minWidth: '250px'
            } }
            variant='outlined'
            color='primary'
            onClick={() => {
              this.onVaultClicked(vault)
            }}
            disabled={ loading }
          >
            <Typography variant={ 'h4' }>{ vault.address }</Typography>
            { (!active) && <div style={{ background: '#DC6BE5', borderRadius: '10px', width: '10px', height: '10px', marginRight: '10px', marginLeft: '18px' }}></div> }
            { (active) && <div style={{ background: '#4caf50', borderRadius: '10px', width: '10px', height: '10px', marginRight: '10px', marginLeft: '18px' }}></div> }
          </Button>
        </div>
      )
    })
  }

  onVaultClicked = (vault) => {
    store.setStore({ vault: vault})
    emitter.emit(VAULT_CHANGED)
    this.props.closeModal()
  }

  onDeployVault = () => {
    this.setState({ borrowerAssetError: false })
    const {
      borrowerAsset,
      vaultCreateAssets
    } = this.state

    let borrowReserve = vaultCreateAssets.filter((asset) => { return asset.reserve_symbol === borrowerAsset })

    if(borrowReserve.length < 1) {
      borrowReserve = { id: '$', name: 'Dollar', reserve: '0x0000000000000000000000000000000000000000', symbol: '$', reserve_symbol: '$' }
    } else {
      borrowReserve = borrowReserve[0]
    }

    console.log(borrowReserve)
    this.setState({ loading: true })
    dispatcher.dispatch({ type: DEPLOY_VAULT, content: { borrowerAsset: borrowReserve } })
  }

  renderAssetSelect = (id) => {
    const { loading, vaultCreateAssets } = this.state
    const { classes } = this.props

    const newFirstElement = { id: '$', name: 'Dollar', reserve: '0x0000000000000000000000000000000000000000', symbol: '$', reserve_symbol: '$' }
    const newArray = [newFirstElement].concat(vaultCreateAssets)

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
        { newArray ? newArray.map(this.renderAssetOption) : null }
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
        </React.Fragment>
      </MenuItem>
    )
  }

  onSelectChange = (event) => {
    let val = []
    val[event.target.name] = event.target.value
    this.setState(val)
  }
}

export default withStyles(styles)(Unlock);
