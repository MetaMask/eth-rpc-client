const JsonRpcEngine = require('json-rpc-engine')
const asMiddleware = require('json-rpc-engine/src/asMiddleware')
const providerFromEngine = require('eth-json-rpc-middleware/providerFromEngine')
const createFetchMiddleware = require('eth-json-rpc-middleware/fetch')
const BlockTracker = require('eth-block-tracker')
const createEthBaseClient = require('./createEthBaseClient')

module.exports = createEthRpcClient


function createEthRpcClient(_opts) {
  // parse options
  const opts = Object.assign({}, {
    rpcUrl: 'https://mainnet.infura.io',
  }, _opts)

  // setup data source
  const { rpcUrl } = opts
  const internalEngine = new JsonRpcEngine()
  const fetchMiddleware = createFetchMiddleware({ rpcUrl })
  internalEngine.push(fetchMiddleware)
  const networkMiddleware = asMiddleware(internalEngine)

  // setup blockTracker
  const blockTrackerOpts = Object.assign({}, {
    provider: providerFromEngine(internalEngine),
  }, opts.blockTracker)
  const blockTracker = new BlockTracker(blockTrackerOpts)

  const baseClientOpts = Object.assign({}, opts, {
    blockTracker,
    networkMiddleware, 
  })
  const { engine, provider } = createEthBaseClient(baseClientOpts)

  return { engine, provider, blockTracker }
}
