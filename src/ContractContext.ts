import { Contract } from "ethers";
import { createContext } from "react";
import { ethers } from "ethers";
//import erc20Metadata from "@openzeppelin/contracts/build/contracts/ERC20.json";
import coqMetadata from "./assets/meta/Coq_metadata.json";
import metadata from "./assets/meta/CoqTip_metadata.json";
const CONTRACT_ABI = metadata.output.abi;
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const COQ_ADDRESS = import.meta.env.VITE_COQ_ADDRESS;

console.log("CONTRACT_ADDRESS", CONTRACT_ADDRESS);
console.log("COQ_ADDRESS", COQ_ADDRESS);

export interface CoqContracts {
    contractAddress: string,
    coqAddress: string,
    contract: Contract,
    coqContract: Contract,
}

export async function getContractsWithRunner(provider: ethers.Eip1193Provider) : Promise<CoqContracts> {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    return {
        contractAddress: CONTRACT_ADDRESS,
        coqAddress: COQ_ADDRESS,
        contract: new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer),
        coqContract: new ethers.Contract(COQ_ADDRESS, coqMetadata.output.abi, signer),
    };
}

export const ContractContext = createContext<{
    contractAddress: string,
    coqAddress: string,
    contract: Contract | undefined,
    coqContract: Contract | undefined,
}>({
    contractAddress: CONTRACT_ADDRESS,
    coqAddress: COQ_ADDRESS,
    contract: undefined,
    coqContract: undefined,
});