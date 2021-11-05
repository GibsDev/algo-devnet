# algo-devnet
Creates a local algorand network for development testing
## Requirements
Needs to be run from an environment that has the [`goal (network)`](https://developer.algorand.org/docs/clis/goal/network/network/) command available
## Basic usage
``` javascript
const algodsdk = require('algosdk');
const devnet = require('./index');

(async () => {
	const network = await devnet();
	console.log(network);
	const node = network.nodes[0];
	const client = new algodsdk.Algodv2(node.adminToken, node.baseServer, node.port);
	console.log(client);
})();
```