import config from "./config";
import async from 'async';
import {
  ERROR,
  GET_BALANCES,
  BALANCES_RETURNED,
  GET_VAULTS,
  VAULTS_RETURNED,
  DEPOSIT_VAULT,
  DEPOSIT_VAULT_RETURNED,
  WITHDRAW_VAULT,
  WITHDRAW_VAULT_RETURNED,
  DEPLOY_VAULT,
  DEPLOY_VAULT_RETURNED,
  CONFIGURE,
  CONFIGURE_RETURNED,
  ADD_BORROWER,
  ADD_BORROWER_RETURNED,
  INCREASE_LIMITS,
  INCREASE_LIMITS_RETURNED,
  DECREASE_LIMITS,
  DECREASE_LIMITS_RETURNED,
  SEARCH_BORROWER,
  SEARCH_BORROWER_RETURNED,
  GET_BORROWER_VAULTS,
  GET_BORROWER_VAULTS_RETURNED,
  BORROW,
  BORROW_RETURNED,
  REPAY,
  REPAY_RETURNED,
  SET_BORROW_ASSET,
  SET_BORROW_ASSET_RETURNED,
  SET_MODEL,
  SET_MODEL_RETURNED
} from '../constants'

import Web3 from 'web3';

import {
  injected,
  ledger
} from "./connectors";

const rp = require('request-promise');
const Dispatcher = require('flux').Dispatcher;
const Emitter = require('events').EventEmitter;

const dispatcher = new Dispatcher();
const emitter = new Emitter();

class Store {
  constructor() {

    this.store = {
      account: null,
      universalGasPrice: '50',
      assets: [],
      vaults: null,
      vault: null,
      borrowerVaults: null,
      connectorsByName: {
        MetaMask: injected,
        TrustWallet: injected,
        Ledger: ledger,
      },
      web3context: null,
    }

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case GET_BALANCES:
            this.getBalances(payload);
            break;
          case GET_VAULTS:
            this.getVaults(payload);
            break;
          case DEPLOY_VAULT:
            this.deployVault(payload);
            break;
          case DEPOSIT_VAULT:
            this.depositVault(payload);
            break;
          case WITHDRAW_VAULT:
            this.withdrawVault(payload);
            break;
          case CONFIGURE:
            this.configure(payload);
            break;
          case ADD_BORROWER:
            this.addBorrower(payload);
            break;
          case INCREASE_LIMITS:
            this.increaseBorrowerLimits(payload);
            break;
          case DECREASE_LIMITS:
            this.decreaseBorrowerLimits(payload);
            break;
          case SEARCH_BORROWER:
            this.searchBorrower(payload)
            break;
          case GET_BORROWER_VAULTS:
            this.getBorrowerVaults(payload)
            break;
          case BORROW:
            this.borrow(payload)
            break;
          case REPAY:
            this.repay(payload)
            break;
          case SET_BORROW_ASSET:
            this.setBorrowAsset(payload)
            break;
          case SET_MODEL:
            this.setModel(payload)
            break;
          default: {
          }
        }
      }.bind(this)
    );
  }

  getStore(index) {
    return(this.store[index]);
  };

  setStore(obj) {
    this.store = {...this.store, ...obj}
    return emitter.emit('StoreUpdated');
  };

  configure = async () => {
    const account = store.getStore('account')

    const web3 = new Web3(store.getStore('web3context').library.provider);

    this._getReserves(web3, account, (err, reserves) => {
      if(err) {
        return emitter.emit(ERROR, err)
      }

      async.mapLimit(reserves, 2, (reserve, callback) => {
        this._getReserveData(web3, account, reserve, callback)
      }, (err, reserveData) => {
        if(err) {
          return emitter.emit(ERROR, err)
        }

        async.mapLimit(reserveData, 2, (reserveInfo, callbackInner) => {
          this._getERC20Data(web3, account, reserveInfo, callbackInner)
        }, (err, reserveDataPopulated) => {
          if(err) {
            return emitter.emit(ERROR, err)
          }

          store.setStore({ assets: reserveDataPopulated })
          emitter.emit(CONFIGURE_RETURNED, reserveDataPopulated)
          emitter.emit(BALANCES_RETURNED, reserveDataPopulated)
        })
      })
    })
  }

  _getReserves = async (web3, account, callback) => {
    const vaultContract = new web3.eth.Contract(config.adminContractABI, config.adminContractAddress)

    try {
      var reserves = await vaultContract.methods.getReserves().call({ from: account.address });
      callback(null, reserves)
    } catch(ex) {
      return callback(ex)
    }
  }

  _getReserveData = async (web3, account, reserve, callback) => {
    const vaultContract = new web3.eth.Contract(config.adminContractABI, config.adminContractAddress)

    try {
      var reserveData = await vaultContract.methods.getReserveData(reserve).call({ from: account.address });
      reserveData.reserve = reserve
      reserveData.address = reserveData.aTokenAddress
      callback(null, reserveData)
    } catch(ex) {
      return callback(ex)
    }
  }

  _getERC20Data = async (web3, account, reserveData, callback) => {
    try {
      const erc20Contract = new web3.eth.Contract(config.erc20ABI, reserveData.address)
      const symbol = await erc20Contract.methods.symbol().call({ from: account.address });
      const name = await erc20Contract.methods.name().call({ from: account.address });
      const decimals = await erc20Contract.methods.decimals().call({ from: account.address });

      reserveData.id = symbol
      reserveData.symbol = symbol
      reserveData.decimals = decimals
      reserveData.name = name

      if(reserveData.reserve.toLowerCase() !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase()) {
        const reserveErc20Contract = new web3.eth.Contract(config.erc20ABI, reserveData.reserve)
        const reserveDecimals = await reserveErc20Contract.methods.decimals().call({ from: account.address });

        reserveData.reserve_symbol = symbol.substring(1)
        reserveData.reserve_decimals = reserveDecimals
      } else {
        reserveData.reserve_symbol = 'ETH'
        reserveData.reserve_decimals = 18
      }
      callback(null, reserveData)
    } catch(ex) {
      console.log(ex)
      return callback(ex)
    }
  }

  getBalances = async () => {
    const account = store.getStore('account')
    const assets = store.getStore('assets')
    const vault = store.getStore('vault')

    const web3 = new Web3(store.getStore('web3context').library.provider);

    async.map(assets, (asset, callback) => {
      async.parallel([
        (callbackInner) => { this._getERC20Balance(web3, asset, account, callbackInner) },
        (callbackInner) => { this._getReserveERC20Balance(web3, asset, account, callbackInner) },
        (callbackInner) => { this._getVaultBalance(web3, asset, vault, account, callbackInner) },
      ], (err, data) => {
        asset.balance = data[0]
        asset.reserve_balance = data[1]
        asset.vaultBalance = data[2]

        callback(null, asset)
      })
    }, (err, assets) => {
      if(err) {
        return emitter.emit(ERROR, err)
      }

      store.setStore({ assets: assets })
      return emitter.emit(BALANCES_RETURNED, assets)
    })
  }

  _getERC20Balance = async (web3, asset, account, callback) => {
    let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.address)

    try {
      var balance = await erc20Contract.methods.balanceOf(account.address).call({ from: account.address });
      balance = parseFloat(balance)/10**asset.decimals
      callback(null, parseFloat(balance))
    } catch(ex) {
      return callback(ex)
    }
  }

  _getReserveERC20Balance = async (web3, asset, account, callback) => {
    if(asset.reserve_symbol === 'ETH') {
      try {
        const eth_balance = web3.utils.fromWei(await web3.eth.getBalance(account.address), "ether");
        callback(null, parseFloat(eth_balance))
      } catch(ex) {
        console.log(ex)
        return callback(ex)
      }
    } else {
      let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.reserve)

      try {
        var balance = await erc20Contract.methods.balanceOf(account.address).call({ from: account.address });
        balance = parseFloat(balance)/10**asset.reserve_decimals
        callback(null, parseFloat(balance))
      } catch(ex) {
        return callback(ex)
      }
    }
  }

  _getVaultBalance = async (web3, asset, vault, account, callback) => {
    if(!vault || !vault.address) {
      return callback(null, 0)
    }

    let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.address)

    try {
      var balance = await erc20Contract.methods.balanceOf(vault.address).call({ from: account.address });
      balance = parseFloat(balance)/10**asset.decimals
      callback(null, parseFloat(balance))
    } catch(ex) {
      return callback(ex)
    }
  }

  deployVault = (payload) => {
    const account = store.getStore('account')

    const { borrowerAsset } = payload.content

    this._callDeployVault(account, borrowerAsset, (err, vault) => {
      if(err) {
        return emitter.emit(ERROR, err)
      }

      store.setStore({ vault: { address: vault } })
      return emitter.emit(DEPLOY_VAULT_RETURNED, vault)
    })
  }

  _callDeployVault = async (account, borrowerAsset, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const vaultContract = new web3.eth.Contract(config.vaultContractABI, config.vaultContractAddress)

    console.log(borrowerAsset.reserve)

    vaultContract.methods.deployVault(borrowerAsset.reserve).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        // callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          callback(null, receipt.transactionHash)
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  getVaults = () => {
    const account = store.getStore('account')

    const web3 = new Web3(store.getStore('web3context').library.provider);

    this._getVaults(web3, account, (err, vaults) => {
      if(err) {
        return emitter.emit(ERROR, err)
      }

      async.mapLimit(vaults, 2, (vault, callback) => {
        this._getVaultAccountData(web3, account, vault, callback)
      }, (err, vaultData) => {
        if(err) {
          return emitter.emit(ERROR, err)
        }

        console.log(vaultData)
        store.setStore({ vaults: vaultData, vault: (vaultData.length > 0 ? vaultData[0] : null) })
        return emitter.emit(VAULTS_RETURNED, vaults)
      })

    })
  }

  _getVaults = async (web3, account, callback) => {
    const vaultContract = new web3.eth.Contract(config.vaultContractABI, config.vaultContractAddress)

    try {
      var vaults = await vaultContract.methods.getVaults(account.address).call({ from: account.address });
      callback(null, vaults)
    } catch(ex) {
      console.log(ex)
      return callback(ex)
    }

  }

  _getVaultAccountData = async (web3, account, vault, callback) => {
    const vaultContract = new web3.eth.Contract(config.vaultContractABI, config.vaultContractAddress)

    try {
      var vaultData = await vaultContract.methods.getVaultAccountData(vault).call({ from: account.address });
      vaultData.address = vault
      const borrowAsset = await vaultContract.methods.getBorrow(vault).call({ from: account.address });
      vaultData.borrowAsset = borrowAsset

      if(vaultData.borrowAsset !== '0x0000000000000000000000000000000000000000') {
        const erc20Contract = new web3.eth.Contract(config.erc20ABI, vaultData.borrowAsset)
        const symbol = await erc20Contract.methods.symbol().call({ from: account.address });
        const decimals = await erc20Contract.methods.decimals().call({ from: account.address });
        const reservePriceUSD = await vaultContract.methods.getReservePriceUSD(borrowAsset).call({ from: account.address })

        vaultData.borrowSymbol = symbol
        vaultData.borrowDecimals = decimals
        vaultData.reservePriceUSD = reservePriceUSD
      } else {
        vaultData.borrowSymbol = '$'
        vaultData.borrowDecimals = '18'
      }

      callback(null, vaultData)
    } catch(ex) {
      console.log(ex)
      const vaultData = {
        address: vault,
        symbol: 'N/A',
        decimals: 0,
        borrowSymbol: 'N/A',
        borrowDecimals: 0,
        reservePriceUSD: 0
      }
      callback(null, vaultData)
    }

  }

  depositVault = (payload) => {
    const account = store.getStore('account')
    const { assets } = payload.content

    async.map(assets, (asset, callback) => {
      this._checkIfApprovalIsNeeded(asset, account, asset.amount, config.vaultContractAddress, callback)
    }, (err, data) => {
      let approvalSubmit = data.filter((asset) => {
        return asset !== false
      })

      let lastId = 0
      if(approvalSubmit.length > 0) {
        lastId = approvalSubmit[approvalSubmit.length-1].id
      }

      async.mapLimit(approvalSubmit, 1, (asset, callback) => {
        let last = false
        if(asset.id === lastId) {
          last = true
        }
        this._callApproval(asset, account, asset.amount, config.vaultContractAddress, last, callback)
      }, (err, result) => {
        async.map(assets, (asset, callbackInner) => {
          this._callDepositVault(account, asset, callbackInner)
        }, (err, data) => {
          if(err) {
            return emitter.emit(ERROR, err);
          }

          return emitter.emit(DEPOSIT_VAULT_RETURNED, data)
        })
      })
    })
  }

  _callDepositVault = async (account, asset, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const vaultContract = new web3.eth.Contract(config.vaultContractABI, config.vaultContractAddress)

    const vault = store.getStore('vault').address
    const aToken = asset.address
    const amount = asset.amount

    var amountToSend = web3.utils.toWei(amount, "ether")
    if (asset.decimals != 18) {
      amountToSend = (amount*10**asset.decimals).toFixed(0);
    }

    vaultContract.methods.deposit(vault, aToken, amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          callback(null, receipt.transactionHash)
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  _checkIfApprovalIsNeeded = async (asset, account, amount, contract, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);
    let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.address)
    const allowance = await erc20Contract.methods.allowance(account.address, contract).call({ from: account.address })

    const ethAllowance = web3.utils.fromWei(allowance, "ether")

    if(parseFloat(ethAllowance) < parseFloat(amount)) {
      callback(null, asset)
    } else {
      callback(null, false)
    }
  }

  _callApproval = async (asset, account, amount, contract, last, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);
    let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.address)
    try {
      if(last) {
        let res = await erc20Contract.methods.approve(contract, web3.utils.toWei("999999999999999", "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
        callback()
      } else {
        erc20Contract.methods.approve(contract, web3.utils.toWei("999999999999999", "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
          .on('transactionHash', function(hash){
            callback()
          })
          .on('error', function(error) {
            if (!error.toString().includes("-32601")) {
              if(error.message) {
                return callback(error.message)
              }
              callback(error)
            }
          })
      }
    } catch(error) {
      if(error.message) {
        return callback(error.message)
      }
      callback(error)
    }
  }

  withdrawVault = (payload) => {
    const account = store.getStore('account')
    const { assets } = payload.content

    async.map(assets, (asset, callbackInner) => {
      this._callWithdrawVault(account, asset, callbackInner)
    }, (err, data) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(WITHDRAW_VAULT_RETURNED, data)
    })
  }

  _callWithdrawVault = async (account, asset, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const vaultContract = new web3.eth.Contract(config.vaultContractABI, config.vaultContractAddress)

    const vault = store.getStore('vault').address
    const aToken = asset.address
    const amount = asset.amount
    var amountToSend = web3.utils.toWei(amount, "ether")
    if (asset.decimals != 18) {
      amountToSend = (amount*10**asset.decimals).toFixed(0);
    }

    vaultContract.methods.withdraw(vault, aToken, amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        // callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          callback(null, receipt.transactionHash)
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  increaseBorrowerLimits = (payload) => {
    const account = store.getStore('account')

    const { borrower, amount } = payload.content

    this._callIncreaseLimit(account, borrower, amount, (err, data) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(INCREASE_LIMITS_RETURNED, data)
    })
  }

  decreaseBorrowerLimits = (payload) => {
    const account = store.getStore('account')

    const { borrower, amount } = payload.content

    this._callDecreaseLimit(account, borrower, amount, (err, data) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(DECREASE_LIMITS_RETURNED, data)
    })
  }

  searchBorrower = (payload) => {
    const account = store.getStore('account')
    const web3 = new Web3(store.getStore('web3context').library.provider);
    const vault = store.getStore('vault')

    const { borrower } = payload.content
    this._getSpenderLimit(web3, borrower, account, vault, (err, data) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(SEARCH_BORROWER_RETURNED, data)
    })
  }

  addBorrower = (payload) => {
    const account = store.getStore('account')

    const { borrower, amount } = payload.content

    this._callIncreaseLimit(account, borrower, amount, (err, data) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(ADD_BORROWER_RETURNED, data)
    })
  }

  setBorrowAsset = (payload) => {
    const account = store.getStore('account')

    const { borrowerAsset } = payload.content

    this._callSetBorrow(account, borrowerAsset, (err, data) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(SET_BORROW_ASSET_RETURNED, data)
    })
  }

  _callSetBorrow = async (account, borrowerAsset, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const vaultContract = new web3.eth.Contract(config.vaultContractABI, config.vaultContractAddress)

    const vault = store.getStore('vault').address

    vaultContract.methods.setBorrow(vault, borrowerAsset.reserve).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        // callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        if(confirmationNumber == 2) {
          callback(null, receipt.transactionHash)
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  _callDecreaseLimit = async (account, borrower, amount, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const vaultContract = new web3.eth.Contract(config.vaultContractABI, config.vaultContractAddress)

    const vault = store.getStore('vault')

    var amountToSend = web3.utils.toWei(amount, "ether")
    if (vault.borrowDecimals != 18) {
      amountToSend = (amount*10**vault.borrowDecimals).toFixed(0);
    }

    vaultContract.methods.decreaseLimit(vault.address, borrower, amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        // callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          callback(null, receipt.transactionHash)
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  _callIncreaseLimit = async (account, borrower, amount, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const vaultContract = new web3.eth.Contract(config.vaultContractABI, config.vaultContractAddress)

    const vault = store.getStore('vault')

    var amountToSend = web3.utils.toWei(amount, "ether")
    if (vault.borrowDecimals != 18) {
      amountToSend = (amount*10**vault.borrowDecimals).toFixed(0);
    }

    vaultContract.methods.increaseLimit(vault.address, borrower, amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        // callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          callback(null, receipt.transactionHash)
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  _getSpenderLimit = async (web3, borrower, account, vault, callback) => {
    const vaultContract = new web3.eth.Contract(config.vaultContractABI, config.vaultContractAddress)

    try {
      var limit = await vaultContract.methods.limit(vault.address, borrower).call({ from: account.address });
      limit = parseFloat(limit)/10**(vault.borrowDecimals ? vault.borrowDecimals : 18)
      callback(null, parseFloat(limit))
    } catch(ex) {
      return callback(ex)
    }
  }

  _getBorrow = async (web3, account, vault, callback) => {
    const vaultContract = new web3.eth.Contract(config.vaultContractABI, config.vaultContractAddress)

    try {
      var borrowAsset = await vaultContract.methods.getBorrow(vault).call({ from: account.address });

      let returnObj = {
        borrowAsset: borrowAsset
      }

      if(borrowAsset !== '0x0000000000000000000000000000000000000000') {
        const erc20Contract = new web3.eth.Contract(config.erc20ABI, borrowAsset)
        const symbol = await erc20Contract.methods.symbol().call({ from: account.address });
        const decimals = await erc20Contract.methods.decimals().call({ from: account.address });
        const reservePriceUSD = await vaultContract.methods.getReservePriceUSD(borrowAsset).call({ from: account.address })

        returnObj.borrowSymbol = symbol
        returnObj.borrowDecimals = decimals
        returnObj.reservePriceUSD = reservePriceUSD
      } else {
        returnObj.borrowSymbol = '$'
        returnObj.borrowDecimals = '18'
      }

      callback(null, returnObj)
    } catch(ex) {
      console.log(ex)
      const vaultData = {
        borrowAsset: borrowAsset,
        borrowSymbol: 'N/A',
        borrowDecimals: 0,
        reservePriceUSD: 0
      }
      callback(null, vaultData)
    }
  }

  getBorrowerVaults = () => {
    const account = store.getStore('account')

    const web3 = new Web3(store.getStore('web3context').library.provider);

    this._getBorrowerVaults(web3, account, (err, borrowerVaults) => {
      if(err) {
        return emitter.emit(ERROR, err)
      }

      async.mapLimit(borrowerVaults, 1, (vault, callback) => {
        this._getBorrow(web3, account, vault, (err, borrowAssetInfo) => {
          var sendVault = {
            address: vault,
            borrowDecimals: borrowAssetInfo.borrowDecimals
          }
          this._getSpenderLimit(web3, account.address, account, sendVault, (err, limit) => {
            const newVault = {
              address: vault,
              limit: limit,
              borrowAsset: borrowAssetInfo.borrowAsset,
              borrowSymbol: borrowAssetInfo.borrowSymbol,
              borrowDecimals: borrowAssetInfo.borrowDecimals,
              reservePriceUSD: borrowAssetInfo.reservePriceUSD
            }
            callback(null, newVault)
          })
        })
      }, (err, borrowerVaultsData) => {
        if(err) {
          return emitter.emit(ERROR, err)
        }

        store.setStore({ borrowerVaults: borrowerVaultsData })
        return emitter.emit(GET_BORROWER_VAULTS_RETURNED, borrowerVaultsData)
      })

    })
  }

  _getBorrowerVaults = async (web3, account, callback) => {
      const vaultContract = new web3.eth.Contract(config.vaultContractABI, config.vaultContractAddress)

      try {
        var vaults = await vaultContract.methods.borrowerVaults(account.address).call({ from: account.address });
        callback(null, vaults)
      } catch(ex) {
        console.log(ex)
        return callback(ex)
      }
  }

  borrow = (payload) => {
    const account = store.getStore('account')
    const { vault, asset, amount } = payload.content

    this._callBorrow(vault, asset, amount, account, (err, borrowResult) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(BORROW_RETURNED, borrowResult)
    })
  }

  _callBorrow = async (vault, asset, amount, account, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const vaultContract = new web3.eth.Contract(config.vaultContractABI, config.vaultContractAddress)

    var amountToSend = web3.utils.toWei(amount, "ether")
    if (asset.decimals != 18) {
      amountToSend = (amount*10**asset.decimals).toFixed(0);
    }

    vaultContract.methods.borrow(vault.address, asset.reserve, amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        // callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          callback(null, receipt.transactionHash)
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  repay = (payload) => {
    const account = store.getStore('account')
    const { vault, asset, amount } = payload.content

    this._checkApproval(asset, account, amount, config.vaultContractAddress, (err) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      this._callRepay(vault, asset, amount, account, (err, repayResult) => {
        if(err) {
          return emitter.emit(ERROR, err);
        }

        return emitter.emit(REPAY_RETURNED, repayResult)
      })
    })
  }

  _callRepay = async (vault, asset, amount, account, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const vaultContract = new web3.eth.Contract(config.vaultContractABI, config.vaultContractAddress)

    var amountToSend = web3.utils.toWei(amount, "ether")
    if (asset.decimals != 18) {
      amountToSend = (amount*10**asset.decimals).toFixed(0);
    }

    vaultContract.methods.repay(vault.address, asset.reserve, amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        // callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          callback(null, receipt.transactionHash)
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  _checkApproval = async (asset, account, amount, contract, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);
    let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.reserve)
    try {
      const allowance = await erc20Contract.methods.allowance(account.address, contract).call({ from: account.address })

      let ethAllowance = web3.utils.fromWei(allowance, "ether")
      if (asset.decimals != 18) {
        ethAllowance = (allowance*10**asset.decimals).toFixed(0);
      }

      var amountToSend = web3.utils.toWei('999999999', "ether")
      if (asset.decimals != 18) {
        amountToSend = (999999999*10**asset.decimals).toFixed(0);
      }

      if(parseFloat(ethAllowance) < parseFloat(amount)) {
        await erc20Contract.methods.approve(contract, amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
        callback()
      } else {
        callback()
      }

    } catch(error) {
      if(error.message) {
        return callback(error.message)
      }
      callback(error)
    }
  }

  setModel = (payload) => {
    const account = store.getStore('account')
    const vault = store.getStore('vault')

    const { value } = payload.content

    this._callSetModel(vault, value, account, (err, res) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(SET_MODEL_RETURNED, res)
    })
  }

  _callSetModel = async (vault, value, account, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const vaultContract = new web3.eth.Contract(config.vaultContractABI, config.vaultContractAddress)

    vaultContract.methods.setModel(vault.address, value).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        // callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          callback(null, receipt.transactionHash)
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  _getGasPrice = async () => {
    try {
      const url = 'https://gasprice.poa.network/'
      const priceString = await rp(url);
      const priceJSON = JSON.parse(priceString)
      if(priceJSON) {
        return priceJSON.fast.toFixed(0)
      }
      return store.getStore('universalGasPrice')
    } catch(e) {
      console.log(e)
      return store.getStore('universalGasPrice')
    }
  }
}

const store = new Store();

export default {
  store: store,
  dispatcher: dispatcher,
  emitter: emitter
};
