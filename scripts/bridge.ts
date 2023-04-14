const { ApiPromise, WsProvider } = require("@polkadot/api");
const { Keyring } = require('@polkadot/keyring');

const JUR_HOLDINGS = '5DqW1QbDu8xctMdS1GSBKPSwM9CLkjJbrayy8KYE2XxYAB2G';

async function main() {
  // Initialise the provider to connect to the local node
  const provider = new WsProvider("ws://127.0.0.1:9944");
  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider });
  // Retrieve the chain & node information information via rpc calls
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ]);
  console.log(
    `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`
  );

  // Construct the keyring after the API (crypto has an async init)
  const keyring = new Keyring({ type: 'sr25519' });

  // Add Alice to our keyring with a hard-derivation path (empty phrase, so uses dev)
  const alice = keyring.addFromUri('//Alice');

  // Create a extrinsic, transferring 12345 units to JUR_HOLDINGS
  const transfer = api.tx.balances.transfer(JUR_HOLDINGS, 12345);

  // Sign and send the transaction using our account
  const hash = await transfer.signAndSend(alice);

  console.log('Transfer sent with hash', hash.toHex());

}

main()
  .catch(console.error)
  .finally(() => process.exit());
