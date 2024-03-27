import React, { useCallback, useEffect, useState } from 'react';
import Divider from '@/components/ui/Divider';
import { useMagic } from '../MagicProvider';
import FormButton from '@/components/ui/FormButton';
import FormInput from '@/components/ui/FormInput';
import ErrorText from '@/components/ui/ErrorText';
import Card from '@/components/ui/Card';
import CardHeader from '@/components/ui/CardHeader';
import { getFaucetUrl, getNetworkToken } from '@/utils/network';
import showToast from '@/utils/showToast';
import Spacer from '@/components/ui/Spacer';
import TransactionHistory from '@/components/ui/TransactionHistory';
import Image from 'next/image';
import Link from 'public/link.svg';
import { createEcdsaKernelAccountClient } from '@zerodev/presets/zerodev';
import { providerToSmartAccountSigner } from 'permissionless';
import { polygonMumbai } from 'viem/chains';
import { ethers, toNumber } from 'ethers';

const SendTransaction = () => {
  const { magic, web3 } = useMagic();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [disabled, setDisabled] = useState(!toAddress || !amount);
  const [hash, setHash] = useState('');
  const [toAddressError, setToAddressError] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const publicAddress = localStorage.getItem('user');

  useEffect(() => {
    setDisabled(!toAddress || !amount);
    setAmountError(false);
    setToAddressError(false);
  }, [amount, toAddress]);

  const sendTransaction = useCallback(async () => {
    if (!web3?.utils.isAddress(toAddress)) {
      return setToAddressError(true);
    }
    if (isNaN(Number(amount))) {
      return setAmountError(true);
    }
    setDisabled(true);
    const magicProvider = await magic.wallet.getProvider();
    const smartAccountSigner = await providerToSmartAccountSigner(magicProvider, publicAddress as Hex);
    const provider = new ethers.BrowserProvider(magic.rpcProvider as any);

    try {
      const accounts = await provider.listAccounts();


      const signer = await provider.getSigner();

      // // Set up your Kernel client
       const kernelClient = await createEcdsaKernelAccountClient({
         chain: polygonMumbai,
         projectId: '3b03e7bc-8dc5-46ff-9ef4-4a08e0cf2621',
         signer: smartAccountSigner,
       });

      const txnParams = {
        from: kernelClient.account.address,
        to: toAddress,
        value: web3.utils.toWei(amount, 'ether'),
        gas: 21000,
      };
      const signedTransaction = await signer.signTransaction(txnParams);
       console.log("Kernel account addr: ", kernelClient.account.address);

       // const txnHash = await kernelClient.sendTransaction({
       //   to: toAddress,
       //   value: web3.utils.toWei(amount, 'ether'), // default to 0
       // })
	    const userOpHash = await kernelClient.sendUserOperation({
	      userOperation: {callData: signedTransaction['raw']},
	    })
    console.log("UserOpHash: ", userOpHash);
    } catch (err) {
      console.error(err);
    }

  }, [web3, amount, publicAddress, toAddress]);

  return (
    <Card>
      <CardHeader id="send-transaction">Send Transaction</CardHeader>
      {getFaucetUrl() && (
        <div>
          <a href={getFaucetUrl()} target="_blank" rel="noreferrer">
            <FormButton onClick={() => null} disabled={false}>
              Get Test {getNetworkToken()}
              <Image src={Link} alt="link-icon" className="ml-[3px]" />
            </FormButton>
          </a>
          <Divider />
        </div>
      )}

      <FormInput
        value={toAddress}
        onChange={(e: any) => setToAddress(e.target.value)}
        placeholder="Receiving Address"
      />
      {toAddressError ? <ErrorText>Invalid address</ErrorText> : null}
      <FormInput
        value={amount}
        onChange={(e: any) => setAmount(e.target.value)}
        placeholder={`Amount (${getNetworkToken()})`}
      />
      {amountError ? <ErrorText className="error">Invalid amount</ErrorText> : null}
      <FormButton onClick={sendTransaction} disabled={!toAddress || !amount || disabled}>
        Send Transaction
      </FormButton>

      {hash ? (
        <>
          <Spacer size={20} />
          <TransactionHistory />
        </>
      ) : null}
    </Card>
  );
};

export default SendTransaction;
