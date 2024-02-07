import React, { useCallback, useEffect, useState } from 'react';
import Divider from '@/components/ui/Divider';
import { useMagic } from '../MagicProvider';
import FormButton from '@/components/ui/FormButton';
import FormInput from '@/components/ui/FormInput';
import ErrorText from '@/components/ui/ErrorText';
import Card from '@/components/ui/Card';
import { encodeFunctionData, parseAbi, publicActions } from "viem"
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
import { bundlerActions } from "permissionless"
import { createWeightedECDSAValidator } from "@zerodev/weighted-ecdsa-validator"

/*
// Get the Provider from Magic and convert it to a SmartAccountSigner
*/
const SetupMultisig = () => {
  const { magic, web3 } = useMagic();
  const [signer1Address, setSigner1Address] = useState('');
  const [signer2Address, setSigner2Address] = useState('');
  const [disabled, setDisabled] = useState(!signer1Address || !signer2Address);
  const [hash, setHash] = useState('');
  const [signer1AddressError, setSigner1AddressError] = useState(false);
  const [signer2AddressError, setSigner2AddressError] = useState(false);


  // Magic setup
  const publicAddress = localStorage.getItem('user');
  useEffect(() => {
    setDisabled(!signer1Address || !signer2Address);
    setToAddressError(false);
  }, [signer1Address, signer2Address]);

  const setupMultisig = useCallback(async () => {
    // ZeroDev setup
    const magicProvider = await magic.wallet.getProvider();
    const smartAccountSigner = await providerToSmartAccountSigner(magicProvider);

    const multisigValidator = await createWeightedECDSAValidator(publicClient, {
      config: {
        threshold: 100,
        signers: [
          { address: signer1Address, weight: 50 },
          { address: signer2Address, weight: 50 },
        ]
      },
      signers: [signer2, signer3],
    })

    // Set up your Kernel client
    const kernelClient = await createEcdsaKernelAccountClient({
      chain: polygonMumbai,
      projectId: "3b03e7bc-8dc5-46ff-9ef4-4a08e0cf2621",
      signer: smartAccountSigner,
    });
    const kernelAddress = kernelClient.account.address;

    if (!web3?.utils.isAddress(toAddress)) {
      return setToAddressError(true);
    }
    setDisabled(true);
    // Send a UserOp
  }, [web3, publicAddress, toAddress]);

  return (
    <Card>
      <CardHeader id="setup-multisig">Setup Multisig</CardHeader>

      <FormInput
        value={signer1Address}
        onChange={(e: any) => setSigner1Address(e.target.value)}
        placeholder="Signer 1 Address -- Will sign with 50% weight"
      />
      {signer1AddressError ? <ErrorText>Invalid address</ErrorText> : null}

      <FormInput
        value={signer2Address}
        onChange={(e: any) => setSigner2Address(e.target.value)}
        placeholder="Signer 2 Address -- Will sign with 50% weight"
      />
      {signer2AddressError ? <ErrorText>Invalid address</ErrorText> : null}

      <FormButton onClick={setupMultisig} disabled={!signer1Address || !signer2Address || disabled}>
      	Setup Multisig
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

export default SetupMultisig;
