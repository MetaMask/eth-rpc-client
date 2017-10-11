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

  // setup infura data source
  const { rpcUrl } = opts
  const internalEngine = new JsonRpcEngine()
  const fetchMiddleware = createFetchMiddleware({ rpcUrl })
  internalEngine.push(fetchMiddleware)
  const networkMiddleware = asMiddleware(internalEngine)

  // setup blockTracker
  const internalProvider = providerFromEngine(internalEngine)
  const blockTracker = new BlockTracker({ provider: internalProvider })
  blockTracker.start()

  const { engine, provider } = createEthBaseClient(Object.assign({
    blockTracker,
    networkMiddlware,
  }, opts))

  return { engine, provider, blockTracker }
}
