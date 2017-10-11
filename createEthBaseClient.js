const assert = require('assert')
const JsonRpcEngine = require('json-rpc-engine')
const asMiddleware = require('json-rpc-engine/src/asMiddleware')
const providerFromEngine = require('eth-json-rpc-middleware/providerFromEngine')
const providerEngineSubproviderAsMiddleware = require('eth-json-rpc-middleware/providerEngineSubproviderAsMiddleware')
const createStatsMiddleware = require('eth-json-rpc-middleware/stats')
const createScaffoldMiddleware = require('eth-json-rpc-middleware/scaffold')
const createInflightCacheMiddleware = require('eth-json-rpc-middleware/inflight-cache')
const createFilterMiddleware = require('eth-json-rpc-filters')
const BlockCacheSubprovider = require('web3-provider-engine/subproviders/cache')
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet')


function createEthBaseClient(_opts) {
  // parse options
  const opts = Object.assign({}, {
    scaffold: {},
    createCacheMiddleware,
    createPolyfillMiddleware,
    createIdMgmtMiddleware,
  }, _opts)

  assert(opts.blockTracker, 'must have opts.blockTracker')
  assert(opts.networkMiddlware, 'must have opts.networkMiddlware')

  // setup blockTracker
  const blockTracker = opts.blockTracker

  // setup external rpc engine stack
  const engine = new JsonRpcEngine()
  const provider = providerFromEngine(engine)
  // client handled
  engine.push(createStatsMiddleware())
  // caching layers
  engine.push(opts.createCacheMiddleware({ opts, provider, blockTracker }))
  // polyfills
  engine.push(opts.createPolyfillMiddleware({ opts, provider, blockTracker }))
  // identity management
  engine.push(opts.createIdMgmtMiddleware({ opts, provider, blockTracker }))
  // network handled
  engine.push(opts.networkMiddlware)

  return { engine, provider }
}

function createCacheMiddleware({ opts, provider, blockTracker }) {
  const internalEngine = new JsonRpcEngine()
  internalEngine.push(createInflightCacheMiddleware())
  internalEngine.push(providerEngineSubproviderAsMiddleware({
    provider,
    blockTracker,
    subprovider: new BlockCacheSubprovider(),
  }))
  return asMiddleware(internalEngine)
}

function createPolyfillMiddleware({ opts, provider, blockTracker }) {
  const internalEngine = new JsonRpcEngine()
  internalEngine.push(createScaffoldMiddleware(opts.scaffold))
  internalEngine.push(createFilterMiddleware({ blockTracker, provider }))
  return asMiddleware(internalEngine)
}

function createIdMgmtMiddleware({ opts, provider, blockTracker }) {
  return providerEngineSubproviderAsMiddleware({
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
  })
}
