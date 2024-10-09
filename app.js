
let web3;
let account;
let usdtContractAddress ;
let usdcContractAddress ;
let explorer;
const erc20Abi = [
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
         "constant": true,
      "inputs": [],
      "name": "name",
      "outputs": [
       {
        "name": "",
     "type": "string"
         }
      ],
        "type": "function"
     }
];

function initializeWeb3() {
    const network = document.getElementById('network').value;
    if (network === 'mainnet') {
        explorer='https://etherscan.io/tx/'
        web3 = new Web3(Web3.givenProvider || "wss://ethereum-rpc.publicnode.com");
        usdtContractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT contract address on Ethereum mainnet
        usdcContractAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48'; // USDC contract address on Ethereum mainnet
    } else if (network === 'holesky') {
        explorer='https://holesky.etherscan.io/tx/'
         usdtContractAddress = '0x66904de8a0D036CF32049A291721bF7dAbdD60d7'; // USDT contract address on Ethereum holesky
         usdcContractAddress = '0xe67c9211Bf5e22c8dE973A22e5d8cDC9F48e7A94'; // USDC contract address on Ethereum holesky
        web3 = new Web3(Web3.givenProvider || "https://ethereum-holesky-rpc.publicnode.com");
    }
      else if (network === 'sepolia') {
         explorer='https://sepolia.etherscan.io/tx/'
        usdtContractAddress = '0x63c650eb5416cD2ff2d24322F3593b1562D4B787'; // USDT contract address on  sepolia mainnet
        usdcContractAddress = '0x2748e7153e450438591382D5daa2E5E497eC645F'; // USDC contract address on  sepolia mainnet
        web3 = new Web3(Web3.givenProvider || "wss://ethereum-sepolia-rpc.publicnode.com");
    }
}

function createWallet() {
    initializeWeb3();
    account = web3.eth.accounts.create();
    document.getElementById('wallet').innerHTML = `
        <p>Address: ${account.address}</p>
        <p>Private Key: ${account.privateKey}</p>
    `;
   
     document.getElementById('walletdiv').innerHTML = '';
  
     document.getElementById('downloadWalletdiv').innerHTML = `
   <button onclick="downloadWalletInfo()">Download Wallet Info</button>
 `;
}

function importWallet() {
    initializeWeb3();
    const privateKey = document.getElementById('privateKey').value;
    account = web3.eth.accounts.privateKeyToAccount(privateKey);
    document.getElementById('wallet').innerHTML = `
        <p>Address: ${account.address}</p>
        <p>Private Key: ${account.privateKey}</p>
    `;
     document.getElementById('walletdiv').innerHTML = '';
     document.getElementById('downloadWalletdiv').innerHTML = `
     <button onclick="downloadWalletInfo()">Download Wallet Info</button>
   `;
}

async function checkBalance() {
    initializeWeb3();
    try {
        const ethBalance = await web3.eth.getBalance(account.address);
        const ethBalanceInEther = web3.utils.fromWei(ethBalance, 'ether');

        const usdtContract = new web3.eth.Contract(erc20Abi, usdtContractAddress);
        const usdtBalance = await usdtContract.methods.balanceOf(account.address).call();
        const usdtBalanceInEther = web3.utils.fromWei(usdtBalance, 'mwei');

        const usdcContract = new web3.eth.Contract(erc20Abi, usdcContractAddress);
        const usdcBalance = await usdcContract.methods.balanceOf(account.address).call();
        const usdcBalanceInEther = web3.utils.fromWei(usdcBalance, 'mwei');

        document.getElementById('balance').innerHTML = `
            <p>ETH Balance: ${ethBalanceInEther} ETH</p>
            <p>USDT Balance: ${usdtBalanceInEther} USDT</p>
            <p>USDC Balance: ${usdcBalanceInEther} USDC</p>
        `;
    } catch (error) {
        console.error('Error:', error);
    }
}



/////////////////////////////////

async function SendToken() {
    const toAddress = document.getElementById('toAddress').value;
    const amount = document.getElementById('amount').value;
     if (confirm("Do you want to proceed with the transaction?")) {
      const tokentype = document.getElementById('token').value;
      console.log(tokentype)
      if (tokentype=== 'eth') {
        send(account.address,toAddress,amount,account.privateKey) ;
      }
  
      else if (tokentype=== 'usdc')
      {
        send(account.address,toAddress,amount,account.privateKey,usdcContractAddress) ;
      }
        else if (tokentype=== 'usdt')
     {
        send(account.address,toAddress,amount,account.privateKey,usdtContractAddress) ;

     }
    }
}

function downloadWalletInfo() {
    const walletInfo = `Address: ${account.address}\nPrivate Key: ${account.privateKey}`;
    const blob = new Blob([walletInfo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wallet.txt';
    a.click();
}


const send  = async (fromAddress, toAddress, amount,privateKey ,ContractAddress) => {
let tx, gasLimit,Tokenname;
const gasPrice = await web3.eth.getGasPrice();
if (ContractAddress==null)
{ Tokenname="ETH"
gasLimit =21000;
tx = {
from: fromAddress,
to: toAddress,
value: web3.utils.toWei(amount, 'ether'), 
gas: gasLimit,
gasPrice: gasPrice
};
}else
{
const Contract = new web3.eth.Contract(erc20Abi, ContractAddress);
const amountInWei = web3.utils.toWei(amount, 'mwei'); 
const txc = Contract.methods.transfer(toAddress, amountInWei);
const data = txc.encodeABI();
gasLimit = await txc.estimateGas({ from: account.address });
Tokenname= await Contract.methods.name().call();

 tx = {
from: fromAddress,
to:  ContractAddress,
value: web3.utils.toWei('0', 'ether'), 
gas: gasLimit,
gasPrice: gasPrice,
data: data
};
}  
const estimatedFee = web3.utils.fromWei((BigInt(gasLimit) * BigInt(gasPrice)).toString(), 'ether');
console.log(`Estimated transaction fee: ${estimatedFee} ETH`);
console.log(`Estimated gasLimit: ${gasLimit} gwei`);
console.log(`Estimated gasPric: ${gasPrice} gwei`);
const confirmation = confirm(`You are about to send ${amount} ${Tokenname}  to ${toAddress}.\n Estimated fee: ${estimatedFee} ETH.\n Do you want to proceed?`);
if (confirmation) {
try {
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    web3.eth.sendSignedTransaction(signedTx.rawTransaction)
        .on('transactionHash', hash => {
            const transactionHash = hash;
            document.getElementById('transaction').innerHTML = `
                <p>Transaction Hash: ${transactionHash}</p>
                <p><a href="${explorer}${transactionHash}" target="_blank">View on Etherscan</a></p>
            `;
            document.getElementById('Transaction_status').innerHTML = "<p>Transaction status: Pending</p>"
            
        })
        .on('receipt', receipt => {
            document.getElementById('Transaction_status').innerHTML = "<p>Transaction status: Success</p>"

        })
        .on('error', error => {
            const transactionHash =  error ;
            document.getElementById('Transaction_status').innerHTML = "<p>Transaction status: Error</p>"
        
                     });
} catch (error) {
    console.error('Error signing transaction:', error);
}
} else {
console.log('Transaction cancelled.');
}
};

