import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import AIToken from './artifacts/contracts/AIToken.sol/AIToken.json';
import AIMarketplace from './artifacts/contracts/AIMarketplace.sol/AIMarketplace.json';

const App = () => {
  const [account, setAccount] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  const TOKEN_ADDRESS = 'YOUR_TOKEN_ADDRESS';
  const MARKETPLACE_ADDRESS = 'YOUR_MARKETPLACE_ADDRESS';

  async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        fetchTokenBalance(address);
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    }
  }

  async function fetchTokenBalance(address) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, AIToken.abi, provider);
    const balance = await tokenContract.balanceOf(address);
    setTokenBalance(ethers.utils.formatEther(balance));
  }

  async function listModel(event) {
    event.preventDefault();
    const { name, description, accessLink, price } = event.target.elements;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, AIMarketplace.abi, signer);
      
      const tx = await marketplace.listModel(
        name.value,
        description.value,
        accessLink.value,
        ethers.utils.parseEther(price.value)
      );
      
      await tx.wait();
      fetchModels();
    } catch (error) {
      console.error('Error listing model:', error);
    }
  }

  async function purchaseModel(modelId, price) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // First approve the marketplace to spend tokens
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, AIToken.abi, signer);
      const approveTx = await tokenContract.approve(MARKETPLACE_ADDRESS, price);
      await approveTx.wait();
      
      // Then purchase the model
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, AIMarketplace.abi, signer);
      const purchaseTx = await marketplace.purchaseModel(modelId);
      await purchaseTx.wait();
      
      fetchModels();
      fetchTokenBalance(account);
    } catch (error) {
      console.error('Error purchasing model:', error);
    }
  }

  async function fetchModels() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, AIMarketplace.abi, provider);
      
      const modelCount = await marketplace.modelCount();
      const modelArray = [];
      
      for (let i = 1; i <= modelCount; i++) {
        const model = await marketplace.getModel(i);
        if (model.isActive) {
          modelArray.push(model);
        }
      }
      
      setModels(modelArray);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  }

  useEffect(() => {
    if (account) {
      fetchModels();
    }
  }, [account]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">AI Model Marketplace</h1>
      
      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Connect Wallet
        </button>
      ) : (
        <div>
          <p>Connected Account: {account}</p>
          <p>Token Balance: {tokenBalance} AIT</p>
          
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">List New Model</h2>
            <form onSubmit={listModel}>
              <input name="name" placeholder="Model Name" required />
              <input name="description" placeholder="Description" required />
              <input name="accessLink" placeholder="Access Link" required />
              <input name="price" type="number" placeholder="Price in AIT" required />
              <button type="submit">List Model</button>
            </form>
          </div>
          
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Available Models</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {models.map((model) => (
                <div key={model.id.toString()} className="border p-4 rounded">
                  <h3 className="font-bold">{model.name}</h3>
                  <p>{model.description}</p>
                  <p>Price: {ethers.utils.formatEther(model.price)} AIT</p>
                  <p>Seller: {model.seller}</p>
                  <button
                    onClick={() => purchaseModel(model.id, model.price)}
                    className="bg-green-500 text-white px-4 py-2 rounded mt-2"
                  >
                    Purchase
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;