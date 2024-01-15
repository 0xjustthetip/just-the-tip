import { useSDK } from "@metamask/sdk-react";
import { Button } from "flowbite-react";
import { ethers } from "ethers";
import { useContext } from "react";
import { ContractContext } from "../ContractContext";

export default function LinkWalletForm() {
    const { provider } = useSDK();
    const { contract } = useContext(ContractContext);

    const linkWallet = async () => {
        if (!provider?.selectedAddress || !contract) {
            return;
        }

        try {
            const hasPendingLink = await contract.hasPendingLink(provider.selectedAddress);
            if (!hasPendingLink) {
                await contract.createPendingLink({ value: ethers.parseEther("0.1") });
            }
        } catch (error) {
            console.error(error);
            return;
        }

        // Redirect to Twitter auth. When the user succesfully authorizes on Twitter, the backend will link the wallet.
        window.location.href = import.meta.env.VITE_BACKEND_HOST + "/auth/twitter?address=" + provider?.selectedAddress;
    }

    return (
        <div className='dark:text-gray-400 text-base text-center flex flex-col justify-center border border-slate-700 rounded-lg p-2'>
            <p>Your wallet is not linked to an X (Twitter) profile!<br/>This means you can't claim any tips.</p>
            {/* <form className="pt-5 flex max-w-md flex-col gap-4 justify-start text-left">

            </form> */}
            <Button onClick={linkWallet} outline gradientDuoTone="purpleToBlue"> Link wallet </Button>
            <p className="pt-5 text-slate-200 font-bold">After linking wallet, please allow 10-30 seconds before refreshing site</p>
        </div>
      );
}