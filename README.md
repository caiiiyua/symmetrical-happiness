# ETH-Tools
 
A set of small scripts to buy help with monitoring or trading on ETH
 
## software version
 
Ensure your `node` and `web3` version is higher than these:
```sh
$ node -v
v15.10.0
$ npm list
├── bignumber.js@9.0.1
├── dotenv@8.2.0
└── web3@1.3.5
```
   
## environment variables
 
```
WALLET_ADDRESS=<account address>
PRIVATE_KEY=<private key>
INFURA_WSS=<infura websocket endpoint>
INFURA_HTTPS=<infura https endpoint>
```
 
## setup steps
  
1. Rename `.env.template` to `.env` and fill out required information
2. Install node.js packages and compile a smart contract code
```sh
npm install
```
3. Run
```sh
npm start
```
 
## License
 
This library is licensed under the MIT License.