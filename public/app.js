require('dotenv').config();
async function loadConfig() {
  try {
      const response = await fetch("http://localhost:5000/config");
      const config = await response.json();

      document.getElementById("tokenAddress").textContent = config.tokenAddress;
      document.getElementById("tokenABI").textContent = JSON.stringify(config.tokenABI, null, 2);
  } catch (error) {
      console.error("Error loading config:", error);
  }
}

loadConfig();

async function connectWallet() {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      if (accounts.length > 0) {
        account = accounts[0];
        document.getElementById('walletAddress').textContent = `Wallet Address: ${account}`;
        await getTokenBalance(account);
      } else {
        alert("No accounts found. Please unlock your MetaMask wallet.");
      }
    } catch (error) {
      alert("Failed to connect to MetaMask. Please try again.");
    }
  } else {
    alert("MetaMask is not installed. Please install MetaMask.");
  }
}


async function getTokenBalance(account) {
  const contract = new web3.eth.Contract(tokenABI, tokenAddress);
  try {
    const balance = await contract.methods.balanceOf(account).call();
    const tokenBalance = web3.utils.fromWei(balance, 'ether');
    document.getElementById('tokenBalance').textContent = `Token Balance: ${tokenBalance} ABA`;
  } catch (error) {
    document.getElementById('tokenBalance').textContent = "Token Balance: Error fetching balance";
  }
}

document.getElementById('connectButton').addEventListener('click', connectWallet);

window.ethereum.on('accountsChanged', (accounts) => {
  if (accounts.length > 0) {
    document.getElementById('walletAddress').textContent = `Wallet Address: ${accounts[0]}`;
    getTokenBalance(accounts[0]);
  } else {
    alert('MetaMask account disconnected!');
    document.getElementById('walletAddress').textContent = 'Wallet Address: Not connected';
    document.getElementById('tokenBalance').textContent = 'Token Balance: 0 UGT';
  }
});

async function createModelListing(event) {
  event.preventDefault();
  const modelName = document.getElementById("model-name").value;
  const modelDescription = document.getElementById("model-description").value;
  const modelPrice = document.getElementById("model-price").value;
  const modelFile = document.getElementById("model-file").files[0];
  const sellerAddress = account;

  if (!sellerAddress) {
    alert("Please connect your wallet first.");
    return;
  }

  const formData = new FormData();
  formData.append("name", modelName);
  formData.append("description", modelDescription);
  formData.append("price", modelPrice);
  formData.append("file", modelFile);
  formData.append("seller", sellerAddress);

  const response = await fetch("/api/createModel", {
    method: "POST",
    body: formData,
  });

  if (response.ok) {
    alert("Model listed successfully!");
    loadModels();
  } else {
    alert("Error listing model!");
  }
}

document.getElementById("create-model-form").addEventListener("submit", createModelListing);

async function loadModels() {
  const response = await fetch("/api/getModels");
  const models = await response.json();
  const modelsList = document.getElementById("models-list");

  modelsList.innerHTML = "";

  models.forEach(model => {
    const modelItem = document.createElement("div");
    modelItem.classList.add("model-item");
    modelItem.innerHTML = `
    <h3>${model.name}</h3>
    <p>${model.description}</p>
    <p>Price: ${model.price} UGT</p>
    <p>Seller: ${model.seller}</p>
    <p>Status: ${model.status}</p>
    ${model.status === 'available' ?
        `<button onclick="buyModel('${model.seller}', '${model.price}', '${model.id}')">Buy</button>` :
        `<button disabled>Sold</button>`
    }
  `;
    modelsList.appendChild(modelItem);
  });
}

async function buyModel(sellerAddress, amount, modelId) {
  try {
    const amountInWei = web3.utils.toWei(amount, 'ether');
    const accounts = await web3.eth.getAccounts();
    const buyer = accounts[0];

    if (buyer.toLowerCase() === sellerAddress.toLowerCase()) {
      alert("You cannot buy your own model.");
      return;
    }

    const contract = new web3.eth.Contract(tokenABI, tokenAddress);
    await contract.methods.transfer(sellerAddress, amountInWei).send({ from: buyer });

    // Update the model status to sold in the backend
    const response = await fetch('/api/markAsSold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId }),  // Ensure modelId is passed correctly
    });

    if (response.ok) {
      alert("Purchase successful! The model is now marked as sold.");
      loadModels(); // Reload models after purchase
    } else {
      const errorData = await response.json();
      alert(`Failed to update model status to sold: ${errorData.error}`);
    }
  } catch (error) {
    alert('Transaction failed: ' + error.message);
  }
}



window.onload = loadModels;