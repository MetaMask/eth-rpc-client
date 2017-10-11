const JsonRpcEngine = require('json-rpc-engine')
const asMiddleware = require('json-rpc-engine/src/asMiddleware')
const providerFromEngine = require('eth-json-rpc-middleware/providerFromEngine')
const providerEngineSubproviderAsMiddleware = require('eth-json-rpc-middleware/providerEngineSubproviderAsMiddleware')
const createStatsMiddleware = require('eth-json-rpc-middleware/stats')
const createScaffoldMiddleware = require('eth-json-rpc-middleware/scaffold')
const createInflightCacheMiddleware = require('eth-json-rpc-middleware/inflight-cache')
const createFetchMiddleware = require('eth-json-rpc-middleware/fetch')
const createFilterMiddleware = require('eth-json-rpc-filters')
const BlockTracker = require('eth-block-tracker')
const BlockCacheSubprovider = require('web3-provider-engine/subproviders/cache')
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet')

module.exports = createEthRpcClient


function createEthRpcClient(_opts) {
  // parse options
  const opts = Object.assign({}, {
    rpcUrl: 'https://mainnet.infura.io',
    scaffold: {},
  }, _opts)

  // setup infura data source
  const { rpcUrl } = opts
  const internalEngine = new JsonRpcEngine()
  const fetchMiddleware = createFetchMiddleware({ rpcUrl })
  internalEngine.push(fetchMiddleware)
  const internalProvider = providerFromEngine(internalEngine)

  // setup blockTracker and CHT
  const blockTracker = new BlockTracker({ provider: internalProvider })
  blockTracker.start()

  // setup external rpc engine stack
  const engine = new JsonRpcEngine()
  const provider = providerFromEngine(engine)
  // client handled
  engine.push(createStatsMiddleware())
  engine.push(createScaffoldMiddleware(opts.scaffold))
  engine.push(createFilterMiddleware({ blockTracker, provider }))
  // caching layers
  engine.push(createInflightCacheMiddleware())
  engine.push(providerEngineSubproviderAsMiddleware({
    provider,
    blockTracker,
    subprovider: new BlockCacheSubprovider(),
  }))
  // identity management
  engine.push(providerEngineSubproviderAsMiddleware({
    provider,
    blockTracker,
    subprovider: new HookedWalletSubprovider({
      // accounts
      getAccounts: opts.getAccounts,
      // transactions
      processTransaction: opts.processTransaction,
      approveTransaction: opts.approveTransaction,
      signTransaction: opts.signTransaction,
      publishTransaction: opts.publishTransaction,
      // message signatures:
      // old eth_sign
      processMessage: opts.processMessage,
      approveMessage: opts.approveMessage,
      signMessage: opts.signMessage,
      // new personal_sign
      processPersonalMessage: opts.processPersonalMessage,
      approvePersonalMessage: opts.approvePersonalMessage,
      signPersonalMessage: opts.signPersonalMessage,
      personalRecoverSigner: opts.personalRecoverSigner,
      // new typed message sign
      processTypedMessage: opts.processTypedMessage,
      approveTypedMessage: opts.approveTypedMessage,
      signTypedMessage: opts.signTypedMessage,
    }),
  }))
  // network handled
  engine.push(asMiddleware(internalEngine))

  return { engine, provider, blockTracker }
}
