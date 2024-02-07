import React, { useCallback, useEffect, useState } from 'react';
import { useMagic } from '../MagicProvider';
import FormButton from '@/components/ui/FormButton';
import FormInput from '@/components/ui/FormInput';
import ErrorText from '@/components/ui/ErrorText';
import Card from '@/components/ui/Card';
import {
  http,
  Hex,
  createPublicClient,
  parseAbi,
  encodeFunctionData,
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import CardHeader from '@/components/ui/CardHeader';
import { getFaucetUrl, getNetworkToken } from '@/utils/network';
import showToast from '@/utils/showToast';
import Spacer from '@/components/ui/Spacer';
import TransactionHistory from '@/components/ui/TransactionHistory';
import Image from 'next/image';
import Link from 'public/link.svg';
import { createEcdsaKernelAccountClient } from '@zerodev/presets/zerodev';
import {
  createKernelAccount,
  createZeroDevPaymasterClient,
  createKernelAccountClient,
} from "@zerodev/sdk"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import {
  signerToSessionKeyValidator,
  ParamOperator,
  serializeSessionKeyAccount,
  deserializeSessionKeyAccount,
  oneAddress,
} from "@zerodev/session-key"
import { providerToSmartAccountSigner, bundlerActions, UserOperation } from 'permissionless';
import { polygonMumbai } from 'viem/chains';

const SetupSessionKey = () => {
  const { magic, web3 } = useMagic();


  // Magic setup
  const publicAddress = localStorage.getItem('user');

  // Zerodev setup
  const publicClient = createPublicClient({
    chain: polygonMumbai,
    transport: http("https://rpc.zerodev.app/api/v2/bundler/3b03e7bc-8dc5-46ff-9ef4-4a08e0cf2621"),
  })
  const contractAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863"
  const contractABI = parseAbi([
    "function mint(address _to) public",
    "function balanceOf(address owner) external view returns (uint256 balance)",
  ])


  const setupSessionKey = useCallback(async () => {
    // ZeroDev setup
    const magicProvider = await magic.wallet.getProvider();
    const signer = await providerToSmartAccountSigner(magicProvider);
    // These are valid for the duration of the session
    const sessionPrivateKey = generatePrivateKey()
    const sessionKeySigner = privateKeyToAccount(sessionPrivateKey)

    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
      signer,
    })

    const masterAccount = await createKernelAccount(publicClient, {
      plugins: {
        validator: ecdsaValidator,
      },
    })
    console.log("Account address:", masterAccount.address)
    const sessionKeyValidator = await signerToSessionKeyValidator(publicClient, {
      signer: sessionKeySigner,
      validatorData: {
        paymaster: oneAddress,
        permissions: [
          {
            target: contractAddress,
            // Maximum value that can be transferred.  In this case we
            // set it to zero so that no value transfer is possible.
            valueLimit: BigInt(0),
            // Contract abi
            abi: contractABI,
            // Function name
            functionName: "mint",
            // An array of conditions, each corresponding to an argument for
            // the function.
            args: [
              {
                // In this case, we are saying that the session key can only mint
                // NFTs to the account itself
                operator: ParamOperator.EQUAL,
                value: signer.address,
              },
            ],
          },
        ],
      },
    })
    const sessionKeyAccount = await createKernelAccount(publicClient, {
      plugins: {
        defaultValidator: ecdsaValidator,
        validator: sessionKeyValidator,
      },
    })

    // Include the private key when you serialize the session key
    const sessionPK = await serializeSessionKeyAccount(sessionKeyAccount, sessionPrivateKey)
    localStorage.setItem('session_key', sessionPK)
  }, [web3]);

  return (
    <Card>
      <CardHeader id="setup-session-key">Setup Session Key</CardHeader>
      {getFaucetUrl() && (
        <div>
            <FormButton onClick={setupSessionKey} disabled={false}>
              Setup Session Key
            </FormButton>
        </div>
      )}
    </Card>
  );
};

export default SetupSessionKey;
