# eth-rpc-client

Ethereum JSON RPC backed client ( provider + blockTracker ).

### usage

```js
const createEthRpcClient = require('eth-rpc-client')

// client provider and blockTracker from options
const { provider, blockTracker } = createEthRpcClient(opts)

// use provider to make requests, blockTracker to listen for new blocks
provider.sendAsync(rpcPayload, cb)
blockTracker.on('block', console.log)
```

### options

see source