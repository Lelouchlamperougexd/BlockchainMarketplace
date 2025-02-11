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
    apiKey: "6335G8RBWT6FBGEX5F3JT1UBYEP77C2J15"  // You'll need to get this from Etherscan
  }
};