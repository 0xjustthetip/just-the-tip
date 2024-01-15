import { useContext, useState } from "react";
import { ContractContext } from "../ContractContext";
import { ethers } from "ethers";
import { Button, ButtonGroup, Label, TextInput } from "flowbite-react";
// import { useSDK } from "@metamask/sdk-react";

function TipForm(props: {updateChainState: () => Promise<void>}) {
    const {contract, contractAddress, coqContract} = useContext(ContractContext);
    const [customAmount, setCustomAmount] = useState(false);
    const [tipAmount, setTipAmount] = useState(0);
    // const [sendButtonDisabled, setSendButtonDisabled] = useState(true);
    const [lastClickedButton, setLastClickedButton] = useState('');

    const tipAmountOnClick = (amount: number) => {
      if (amount === -1) {
        setCustomAmount(true);
        return;
      }
      setTipAmount(amount);
      setCustomAmount(false);
    }

    const formOnSubmit = async (event: any) => {
        if (lastClickedButton === 'approveButton') {
            approveTipAmount(event);
        } else if (lastClickedButton === 'sendButton') {
            sendTip(event);
        }
    }

    const approveTipAmount = async (event: any) => {
        event.preventDefault();

        if (!contract || !coqContract) {
            return;
        }
        try {
            const amount = ethers.parseEther(event.target.tip_amount.value);
            const tx = await coqContract.approve(contractAddress, amount);
            await tx.wait();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            // coqContract.on(/* coqContract.filters.Approval(provider?.selectedAddress, null) */ "Approval", (_owner, _spender, _value, _event) => {
            //     console.log("Approval event received");
            //     setSendButtonDisabled(false);
            // });
        } catch (error) {
            console.error(error);
            return;
        }
    }

    const sendTip = async (event: any) => {
      event.preventDefault();

      if (!contract || !coqContract) {
        return;
      }
      try {
        const recipient = event.target.tip_to.value;
        const amount = ethers.parseEther(event.target.tip_amount.value);
        await contract.sendTip(recipient, amount, { value: ethers.parseEther("0.01") });
        props.updateChainState();
      } catch (error) {
        console.error(error);
        return;
      }
    }

    return (
        <form className='flex flex-col gap-8' onSubmit={formOnSubmit}>
            <div>
                <div className='pb-2'>
                    <Label htmlFor="tip_to">
                        To
                    </Label>
                </div>

                <TextInput type="text" id="tip_to" placeholder='X (Twitter) handle' addon="@" />
            </div>

            <div>
                <div className='flex gap-2 items-center pb-2 justify-between'>
                    <Label htmlFor="tip_amount">
                        Tip
                    </Label>
                    <div className='flex gap-2 items-center'>
                        <ButtonGroup>
                            <Button outline gradientDuoTone="greenToBlue"  pill size='xs' onClick={() => tipAmountOnClick(1000)}>Small</Button>
                            <Button outline gradientDuoTone="greenToBlue"  pill size='xs' onClick={() => tipAmountOnClick(100000)}>Medium</Button>
                            <Button outline gradientDuoTone="greenToBlue"  pill size='xs' onClick={() => tipAmountOnClick(1000000)}>Large</Button>
                            <Button outline gradientDuoTone="purpleToPink"  pill size='xs' onClick={() => tipAmountOnClick(-1)}>Custom</Button>
                        </ButtonGroup>
                    </div>
                </div>

                <TextInput type="text" id="tip_amount" disabled={!customAmount} value={tipAmount} onChange={(evt) => {
                    if (customAmount) {
                        const amount = parseInt(evt.target.value);
                        setTipAmount(!Number.isNaN(amount) ? amount : 0);
                    }
                }}/>
            </div>
            <div className='flex flex-col gap-5'>
                <Button outline gradientDuoTone="purpleToBlue" type='submit' onClick={() => setLastClickedButton("approveButton")}>
                    Approve
                </Button>
                <p className="text-center text-gray-400">Please wait for the approval transaction before sending</p>
                <Button outline gradientDuoTone="purpleToBlue" type='submit'  onClick={() => setLastClickedButton("sendButton")}>
                    Send
                </Button>
            </div>
        </form>
    );
}

export default TipForm;