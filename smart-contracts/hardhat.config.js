require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("solidity-coverage");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-solhint");

const config = require('./config')

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
    },
    bscTestnet: {
      url: config.ankrBscTestnetApiUrl,
      accounts: config.testnetAccounts
    },
    localhost: {
      url: 'http://127.0.0.1:7545'
    }
  },
  etherscan: {
    apiKey: config.bscScanApiKey
  },
  solidity: {
    compilers: [
      {
        version: "0.5.16"
      },
      {
        version: "0.6.12",
        settings: { }
      },
      {
        version: "0.7.6"
      }
    ]
  }
};

