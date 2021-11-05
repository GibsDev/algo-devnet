const algodsdk = require('algosdk');
const devnet = require('./index');

(async () => {
	const network = await devnet();
	console.log(network);
	const node = network.nodes[0];
	const client = new algodsdk.Algodv2(node.adminToken, node.baseServer, node.port);
	console.log(client);
})();