require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); 

module.exports = {
  solidity: "0.8.20",
  networks: {
    holesky: {
      url: process.env.HOLESKY_RPC_URL || "", 
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [], 
    },
  },
  etherscan: {
    apiKey: "GA8GAI456UFRQSF2HMTY5UISHC8TJJKXU7"  // You'll need to get this from Etherscan
  }
};