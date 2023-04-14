# Hashed TimeLock Contract to Bridge JUR tokens from VeChainThor to Substrate chain
#### Inspiration from: https://github.com/chatch/hashed-timelock-contract-ethereum/blob/master/test/htlcERC20.js
#### Substrate side: https://github.com/carloskiron/timeLockPalletSubstrate/tree/master/pallets/aswap
## How to
### .env settings for stripts and unit tests
```
SUBSTRATE_WS_URL="ws://127.0.0.1:9944" 
TIME_LOCK_CONTRACT="0x..."
JUR_CONTRACT="0x..."
```

### Installation
```shell
yarn install
```
### Compile contracts
```shell
yarn hardhat compile
```
### VeChainThor / Subtrate chain - bridge flow
```shell
test/JURBridge.ts
```
### Deploy contracts on VeChainThor Testnet
```shell
yarn hardhat run ./scripts/deployTimeLockContract.ts --network vechain      
```
