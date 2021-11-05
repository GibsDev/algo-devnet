const fs = require('fs/promises');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');

const DEFAULT_TEMPLATE = path.resolve(__dirname , './devnet_network_template.json');

module.exports = async ({ root = './devnet', template = DEFAULT_TEMPLATE, name = 'devnet' } = {}) => {
	await assertGoalCommandAvailableInPath();
	try {
		try {
			await fs.access(root);
		} catch (e) {
			console.log('Creating new network...');
			await networkCreate({ root: root, template: template, name: name });
		}

		if (!(await networkRunning(root))) {
			await networkStart(root);
		}

		process.on('exit', async () => {
			await networkStop(root);
		});

		const network = await getNetworkInfo(root);
		return network;
	} catch (e) {
		throw e;
	}
}

// Checks that the goal command is available
async function assertGoalCommandAvailableInPath() {
	try {
		await exec(`goal --version`);
	} catch (e) {
		if (e.stderr && e.stderr.startsWith(`'goal' is not recognized`)) {
			console.log(`goal command not found. The 'algo-devnet' package must be used in an environment where goal is installed and available in the PATH. https://developer.algorand.org/docs/run-a-node/setup/install/\n`);
		}
		throw e;
	}
}

async function networkRunning(root = './devnet') {
	try {
		await networkStatus(root);
	} catch (e) {
		return false;
	}
	return true;
}

async function networkStatus(root = './devnet') {
	const { stdout } = await exec(`goal network status -r ${root}`);
	return stdout;
}

async function networkCreate({ root = './devnet', template = './devnet_network_template.json', name = 'devnet' } = {}) {
	console.log(`Creating network '${name}' at '${root}' with template '${template}'`);
	return exec(`goal network create -n ${name} -r ${root} -t ${template}`);
}

async function networkStart(root = './devnet') {
	console.log(`Starting network at '${root}'...`);
	try {
		return exec(`goal network start -r ${root}`);
	} catch (e) {
		console.error(`Failed to start network at '${root}'`);
		throw e;
	}
}

async function networkStop(root = './devnet') {
	console.log(`Stopping network at '${root}'...`);
	try {
		return exec(`goal network stop -r ${root}`);
	} catch (e) {
		console.error(`Failed to stop network at '${root}'`);
		throw e;
	}
}

// Checks for directories with genesis.json files in them
async function getNodeDirs(root) {
	const dirs = [];
	const filenames = await fs.readdir(root);
	for (const name of filenames) {
		const possibleDir = path.resolve(root, name);
		const stat = await fs.stat(possibleDir);
		if (stat.isDirectory()) {
			const genesis = path.resolve(possibleDir, 'genesis.json');
			try {
				await fs.stat(genesis);
				dirs.push(possibleDir);
			} catch (e) { }
		}
	}
	return dirs;
}

async function getToken(nodePath) {
	return (await fs.readFile(path.resolve(nodePath, 'algod.token'))).toString();
}

async function getAdminToken(nodePath) {
	return (await fs.readFile(path.resolve(nodePath, 'algod.admin.token'))).toString();
}

// Network needs to be running
async function getPID(nodePath) {
	return Number((await fs.readFile(path.resolve(nodePath, 'algod.pid'))).toString());
}

// Network needs to be running
async function getServerInfo(nodePath) {
	const serverString = (await fs.readFile(path.resolve(nodePath, 'algod.net'))).toString();
	const split = serverString.split(':');
	return { hostname: split[0], baseServer: 'https://' + split[0], port: Number(split[1]) };
}

// Network needs to be running
async function getNetworkInfo(root) {
	const networkFile = (await fs.readFile(path.resolve(root, 'network.json'))).toString();
	const networkName = JSON.parse(networkFile).Name;
	const network = {
		name: networkName,
		nodes: []
	};
	// Build network response object
	const nodeDirs = await getNodeDirs(root);
	for (const nodeDir of nodeDirs) {
		const basename = path.basename(nodeDir);
		network.nodes.push({
			name: basename,
			token: await getToken(nodeDir),
			adminToken: await getAdminToken(nodeDir),
			pid: await getPID(nodeDir),
			...(await getServerInfo(nodeDir))
		});
	}
	return network;
}