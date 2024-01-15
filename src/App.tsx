/* global BigInt */
import { useSDK } from '@metamask/sdk-react';

import Header from "./components/Header"

import './App.css'
import Main from './components/Main';
import { Button } from 'flowbite-react';
import { ContractContext, CoqContracts, getContractsWithRunner } from './ContractContext';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

function App() {
    //const { sdk, connected, _connecting, provider, chainId } = useSDK();
    const { sdk, provider } = useSDK();
    const [contracts, setContracts] = useState<CoqContracts | undefined>(undefined);

    const connect = async () => {
        try {
            await sdk?.connect();
        } catch(err) {
            console.warn(`failed to connect..`, err);
        }
    };

    useEffect(() => {
        const initContract = async () => {
            if (provider) {
                setContracts(await getContractsWithRunner(provider));
            }
        }
        initContract();
    }, [provider]);

    return (
        <div className='w-full h-full p-5 flex justify-between'>
            <Header></Header>
            <div className='w-full'>
                {provider?.selectedAddress && contracts &&
                    <ContractContext.Provider value={contracts}>
                        <Main/>
                        <div className='flex flex-col w-full items-center pt-5'>
                            <p className='text-center text-slate-200'>
                                Test COQ faucet
                            </p>
                            <Button onClick={async () => { await contracts.coqContract.mint(provider.selectedAddress, ethers.parseEther("100000000")); }}> Get COQ </Button>
                            <p className='text-center text-slate-200 pt-10'>
                                PLEASE NOTE<br/>
                                This site is still in development.<br/>
                                UI elements do not update automatically yet, so please refresh the page after transactions.<br/>
                                Linking wallets to Twitter handles, sending and claiming tips works.<br/>
                                The lottery is not yet implemented, so the lottery panel is just a mockup.<br/>
                                BOK
                            </p>
                        </div>
                    </ContractContext.Provider>}
                {!provider?.selectedAddress &&
                    <div className='h-full flex justify-center items-center'>
                        <Button size="xl" outline gradientDuoTone="purpleToBlue" onClick={() => connect()} type='submit'>
                            Connect
                        </Button>
                    </div>
                }
            </div>
        </div>
    );
}

export default App
