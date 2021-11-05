const algosdk = require('algosdk');

const kmdtoken = '09169595d7d77d8dd0f57b6103140ef464fb77fc85ff2d68ef75c60e31381216';
const kmdserver = 'http://127.0.0.1';
const kmdport = 7833;

const kmdclient = new algosdk.Kmd(kmdtoken, kmdserver, kmdport);

const defaultaddress = '2AAGXBAWOSCYSSTNQIM3FUW2Y6BGCDE7ARIJVED34KIACK2SR3EH23TCIA';

(async () => {
	let walletid = null;
	let wallets = (await kmdclient.listWallets()).wallets;
	wallets.forEach(function (wallet) {
		console.log(wallet);
		if (wallet.name === 'unencrypted-default-wallet') {
			walletid = wallet.id;
		}
	});
	let wallethandle = (await kmdclient.initWalletHandle(walletid, "")).wallet_handle_token;
    console.log(wallethandle);
	let accountKey = (await kmdclient.exportKey(wallethandle, "", defaultaddress));
    let mn = (await algosdk.secretKeyToMnemonic(accountKey.private_key));
    console.log("Account Mnemonic:", mn);
})().catch(e => {
	console.log(e);
})