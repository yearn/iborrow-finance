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
  CONFIGURE_RETURNED
} from '../constants'

import Web3 from 'web3';

import {
  injected,
  ledger
} from "./connectors";

const Dispatcher = require('flux').Dispatcher;
const Emitter = require('events').EventEmitter;

const dispatcher = new Dispatcher();
const emitter = new Emitter();

class Store {
  constructor() {

    this.store = {
      account: null,
      universalGasPrice: '45',
      assets: [
        // {
        //   id: 'aDAI',
        //   name: "Aave DAI",
        //   symbol: 'aDAI',
        //   balance: 0,
        //   decimals: 18,
        //   address: '0xfc1e690f61efd961294b3e1ce3313fbd8aa4f85d'
        // },
        // {
        //   id: 'aUSDT',
        //   name: "Aave USDT",
        //   symbol: 'aUSDT',
        //   balance: 0,
        //   decimals: 18,
        //   address: '0x71fc860F7D3A592A4a98740e39dB31d25db65ae8'
        // },
        // {
        //   id: 'aWBTC',
        //   name: "Aave BTC",
        //   symbol: 'aWBTC',
        //   balance: 0,
        //   decimals: 18,
        //   address: '0xFC4B8ED459e00e5400be803A9BB3954234FD50e3'
        // }
      ],
      vaults: [

      ],
      vault: null,
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

      async.mapLimit(reserves, 4, (reserve, callback) => {
        this._getReserveData(web3, account, reserve, callback)
      }, (err, reserveData) => {
        if(err) {
          return emitter.emit(ERROR, err)
        }

        async.mapLimit(reserveData, 4, (reserveInfo, callbackInner) => {
          this._getERC20Data(web3, account, reserveInfo, callbackInner)
        }, (err, reserveDataPopulated) => {
          console.log(err)
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
    const erc20Contract = new web3.eth.Contract(config.erc20ABI, reserveData.address)

    try {
      const symbol = await erc20Contract.methods.symbol().call({ from: account.address });
      const name = await erc20Contract.methods.name().call({ from: account.address });
      const decimals = await erc20Contract.methods.decimals().call({ from: account.address });
      var balance = await erc20Contract.methods.balanceOf(account.address).call({ from: account.address });
      balance = parseFloat(balance)/10**decimals
      balance = parseFloat(balance)

      reserveData.id = symbol
      reserveData.balance = balance
      reserveData.symbol = symbol
      reserveData.decimals = decimals
      reserveData.namea = name

      callback(null, reserveData)
    } catch(ex) {
      console.log(ex)
      return callback(ex)
    }
  }

  getBalances = async () => {
    const account = store.getStore('account')
    const assets = store.getStore('assets')

    const web3 = new Web3(store.getStore('web3context').library.provider);

    async.map(assets, (asset, callback) => {
      async.parallel([
        (callbackInner) => { this._getERC20Balance(web3, asset, account, callbackInner) },
      ], (err, data) => {
        asset.balance = data[0]

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

  deployVault = () => {
    const account = store.getStore('account')

    this._callDeployVault(account, (err, vault) => {
      if(err) {
        return emitter.emit(ERROR, err)
      }

      store.setStore({ vault: { address: vault } })
      return emitter.emit(DEPLOY_VAULT_RETURNED, vault)
    })
  }

  _callDeployVault = async (account, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const vaultContract = new web3.eth.Contract(config.vaultContractABI, config.vaultContractAddress)

    vaultContract.methods.deployVault().send({ from: account.address, gasPrice: web3.utils.toWei(store.getStore('universalGasPrice'), 'gwei') })
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

      async.mapLimit(vaults, 1, (vault, callback) => {
        this._getVaultAccountData(web3, account, vault, callback)
      }, (err, vaultData) => {
        if(err) {
          return emitter.emit(ERROR, err)
        }

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
      callback(null, vaultData)
    } catch(ex) {
      console.log(ex)
      return callback(ex)
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

    vaultContract.methods.deposit(vault, aToken, amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(store.getStore('universalGasPrice'), 'gwei') })
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
        let res = await erc20Contract.methods.approve(contract, web3.utils.toWei("999999999999999", "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(store.getStore('universalGasPrice'), 'gwei') })
        console.log(res)
        callback()
      } else {
        erc20Contract.methods.approve(contract, web3.utils.toWei("999999999999999", "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(store.getStore('universalGasPrice'), 'gwei') })
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

    vaultContract.methods.withdraw(vault, aToken, amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(store.getStore('universalGasPrice'), 'gwei') })
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
}

const store = new Store();

export default {
  store: store,
  dispatcher: dispatcher,
  emitter: emitter
};
