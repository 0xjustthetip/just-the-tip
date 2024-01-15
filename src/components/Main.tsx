import { Button, Tooltip } from 'flowbite-react';
import { useContext, useEffect, useState } from 'react';
import logo from '../assets/coqinu-incoqwetrust.png'
import LinkWalletForm from './LinkWalletForm';
import { useSDK } from '@metamask/sdk-react';
import { ContractContext } from '../ContractContext';
import { ethers } from 'ethers';
import numeral from 'numeral';
import TipForm from './TipForm';

interface UIStateFromChain {
    handle: string;
    coqHolding: string;
    coqUnclaimed: string;
    prizePool: number;
    tickets: number;
    totalTickets: number;
    isWinner: boolean;
}

export default function Main() {
    const { provider } = useSDK();
    const {contract, coqContract} = useContext(ContractContext);
    const [isWinner, _] = useState(false);

    const [chainState, setChainState] = useState<UIStateFromChain | undefined>(undefined);

    const updateChainState = async () => {
        try {
            const coqHolding = await coqContract?.balanceOf(provider?.selectedAddress);
            const handle = await contract?.getHandle(provider?.selectedAddress);
            const coqUnclaimed = await contract?.unclaimedTips(provider?.selectedAddress);

            setChainState({
                coqHolding: numeral(ethers.formatEther(coqHolding.toString())).format('0.0a'),
                handle: handle,
                coqUnclaimed: numeral(ethers.formatEther(coqUnclaimed.toString())).format('0.0a'),
                prizePool: 0,
                tickets: 0,
                totalTickets: 0,
                isWinner: false,
            });
        } catch (error) {
            console.error(error);
            return;
        }
    }

    useEffect(() => {
        if (provider?.selectedAddress || contract) {
            updateChainState();
        }
    }, [provider?.selectedAddress, contract, coqContract]);

    const claimTips = async () => {
        if (!contract) {
            return;
        }

        try {
            const tx = await contract.claimTips();
            await tx.wait();
            if (!chainState) {
                return;
            }
            /* const coqHolding = await coqContract?.balanceOf(provider?.selectedAddress);
            setChainState({
                ...chainState,
                coqHolding: numeral(ethers.formatEther(coqHolding.toString())).format('0.0a'),
                coqUnclaimed: '0',
            }); */
            updateChainState();
        } catch (error) {
            console.error(error);
            return;
        }
    }

    const shortenAddress = (address: string | null | undefined) => {
        if (!address) {
            return '';
        }
        return address.substring(0, 7) + '...' + address.substring(address.length - 5);
    }

    return (
        <div className='px-20 flex justify-evenly gap-5'>

            <div className='w-1/3 py-10 flex justify-center border-slate-600 border-2 rounded-md bg-gray-800'>
                <div className='flex flex-col gap-5 justify-start w-10/12'>
                    <h1 className="text-4xl font-bold text-center dark:text-slate-200">Wallet</h1>
                    <p className='dark:text-slate-200 text-center break-words '>{shortenAddress(provider?.selectedAddress)}</p>

                    {!chainState?.handle && <LinkWalletForm/>}
                    {chainState?.handle && <p className='dark:text-slate-200 text-center break-words '>{chainState?.handle}</p>}

                    <h2 className="mt-5 text-xl font-bold text-center dark:text-gray-400">Holding</h2>
                    <div className='-mt-2'>
                        <p className='dark:text-slate-200 text-2xl text-center font-bold'>
                            {chainState?.coqHolding}
                        </p>
                        <div className='flex items-center justify-center mt-2'>
                            <img src={logo} className='h-6 w-6 mr-2'></img>
                            <p className='dark:text-slate-200 text-md text-center font-bold'>
                                COQ
                            </p>
                        </div>
                    </div>


                    <h2 className="mt-5 text-xl font-bold text-center dark:text-gray-400">Unclaimed tips</h2>
                    <div className='-mt-2'>
                        <p className='dark:text-slate-200 text-2xl text-center font-bold'>
                            {chainState?.coqUnclaimed}
                        </p>
                        <div className='flex items-center justify-center mt-2'>
                            <img src={logo} className='h-6 w-6 mr-2'></img>
                            <p className='dark:text-slate-200 text-md text-center font-bold'>
                                COQ
                            </p>
                        </div>
                    </div>
                    <Button outline gradientDuoTone="purpleToBlue" onClick={claimTips}>
                        Claim
                    </Button>

                </div>
            </div>


            <div className='w-1/3 py-10 flex justify-center border-orange-500 border-2 rounded-md bg-gray-800 shadow'>
                <div className='flex flex-col gap-5 justify-start w-10/12'>
                    <h1 className="text-4xl font-bold text-center dark:bg-gradient-to-r dark:from-orange-400 dark:via-orange-300 dark:to-yellow-200 dark:text-transparent dark:bg-clip-text animate-gradient bg-300%">Prize Pool</h1>

                    <div>
                        <p className='dark:text-slate-200 text-2xl text-center font-bold'>
                            161.5k
                        </p>
                        <div className='flex items-center justify-center mt-2'>
                            <img src={logo} className='h-6 w-6 mr-2'></img>
                            <p className='dark:text-slate-200 text-md text-center font-bold'>
                                COQ
                            </p>
                        </div>
                    </div>

                    <div className='mt-5 self-center' >
                        <Tooltip content="Only the lottery winner can claim" className={!isWinner ? '' : 'hidden'}>
                            <Button outline gradientDuoTone="purpleToBlue" onClick={() => {}} disabled={!isWinner}>
                                Claim
                            </Button>
                        </Tooltip>
                    </div>

                    <div className="relative flex pt-5 items-center">
                        <div className="flex-grow border-t border-gray-400"></div>
                        <span className="flex-shrink mx-4 text-gray-400">Next lottery</span>
                        <div className="flex-grow border-t border-gray-400"></div>
                    </div>
                    <div>
                        <p className='dark:text-gray-400 text-sm text-center py-0'>
                            4:20pm 1/16/2024
                        </p>
                        <p className='dark:text-slate-200 text-2xl text-center font-bold'>
                            08:01:23
                        </p>
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-center dark:text-gray-400">Lottery tickets</h2>
                    <div className='-mt-2'>
                        <p className='dark:text-gray-400 text-sm text-center py-0'>
                            Your tickets
                        </p>
                        <div>
                            <p className='dark:text-slate-200 text-2xl text-center font-bold'>
                                10,195
                            </p>
                            <p className='dark:text-gray-400 text-sm text-center py-0'>
                                1.01%
                            </p>
                        </div>

                        {/* <div className='flex items-center justify-center mt-2'>
                            <img src={tiplogo} className='h-6 w-6 mr-2'></img>
                            <p className='dark:text-slate-200 text-md text-center font-bold'>
                                TIP
                            </p>
                        </div> */}
                    </div>

                    <div className='-mt-2'>
                        <p className='dark:text-gray-400 text-sm text-center py-0'>
                            Total tickets
                        </p>
                        <p className='dark:text-slate-200 text-2xl text-center font-bold'>
                            1,000,195
                        </p>
                        {/* <div className='flex items-center justify-center mt-2'>
                            <img src={tiplogo} className='h-6 w-6 mr-2'></img>
                            <p className='dark:text-slate-200 text-md text-center font-bold'>
                                TIP
                            </p>
                        </div> */}
                    </div>
                </div>
            </div>

            <div className='w-1/3 py-10 flex justify-center border-slate-600 border-2 rounded-md bg-gray-800'>
                <div className='flex flex-col gap-5 justify-start w-10/12'>
                    <h1 className="text-4xl font-bold text-center dark:text-slate-200">Tip</h1>
                    <TipForm updateChainState={updateChainState}/>
                </div>
            </div>

        </div>
    );
}