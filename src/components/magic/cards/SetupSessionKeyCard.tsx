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
	addressToEmptyAccount,
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
import { Network, Alchemy, NftFilters } from "alchemy-sdk"

const settings = {
	apiKey: "9b1326CuGOhpxr_RhB2QoPXKpfbuJsDF",
	network: Network.MATIC_MUMBAI,
};

const alchemy = new Alchemy(settings);

const SetupSessionKey = () => {
  const { magic, web3 } = useMagic();


  // Magic setup
  const publicAddress = localStorage.getItem('user');

  // Zerodev setup
  const publicClient = createPublicClient({
    chain: polygonMumbai,
    transport: http("https://rpc.zerodev.app/api/v2/bundler/3b03e7bc-8dc5-46ff-9ef4-4a08e0cf2621"),
  })
  const spaceCowContractAddress = "0xC6348A8060fF6B4518639A96Bc5A5Ae3c869c50D"
	const contractAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863"
  const spaceCowContractABI = parseAbi([
    "function mintTo(address _to, string _uri) public",
    "function balanceOf(address owner) external view returns (uint256 balance)",
    "function safeTransferFrom(address from, address to, uint256 value) external view returns (bool transferred)",
    "function approve(address owner, uint256 value) external view returns (bool approved)",
  ])
	const contractABI = parseAbi([
		"function mint(address _to) public",
		"function balanceOf(address owner) external view returns (uint256 balance)",
	])



  const setupAdminSessionKey = useCallback(async () => {

    console.log("fetching NFTs for address:", publicAddress);
		const nftsForOwner = await alchemy.nft.getContractsForOwner(publicAddress, {
      excludeFilters: [NftFilters.SPAM]
		});

    console.log("Owned NFTs:", nftsForOwner)
    // ZeroDev setup
    const magicProvider = await magic.wallet.getProvider();
    const signer = await providerToSmartAccountSigner(magicProvider);
    //const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    //  signer,
    //})
		const emptySessionKeySigner = addressToEmptyAccount(publicAddress)

    // These are valid for the duration of the session
    const sessionPrivateKey = generatePrivateKey()
    const sessionKeySigner = privateKeyToAccount(sessionPrivateKey)

    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
      signer,
    })


    const sessionKeyValidator = await signerToSessionKeyValidator(publicClient, {
      signer: emptySessionKeySigner, //sessionKeySigner,
      validatorData: {
        paymaster: oneAddress,
        permissions: [
          {
            target: spaceCowContractAddress,
            // Maximum value that can be transferred.  In this case we
            // set it to zero so that no value transfer is possible.
            valueLimit: BigInt(0),
            // Contract abi
            abi: spaceCowContractABI,
            // Function name
            functionName: "mintTo",
            // An array of conditions, each corresponding to an argument for
            // the function.
            args: [
              {
                // In this case, we are saying that the session key can only mint
                // NFTs to the account itself
                operator: ParamOperator.EQUAL,
                value: "0xF4EAD186dd9e843a6c59F1280FD89e9B4Cf93794", //signer.address
              },
              {
                operator: ParamOperator.NOT_EQUAL,
                value: "",
              },
            ],
          },
          {
            target: spaceCowContractAddress,
            // Maximum value that can be transferred.  In this case we
            // set it to zero so that no value transfer is possible.
            valueLimit: BigInt(0),
            // Contract abi
            abi: spaceCowContractABI,
            // Function name
            functionName: "mintTo",
            // An array of conditions, each corresponding to an argument for
            // the function.
            args: [
              {
                // In this case, we are saying that the session key can only mint
                // NFTs to the account itself
                operator: ParamOperator.EQUAL,
                value: signer.address,
              },
              {
                operator: ParamOperator.NOT_EQUAL,
                value: "",
              },
            ],
          },
          {
            target: spaceCowContractAddress,
            // Maximum value that can be transferred.  In this case we
            // set it to zero so that no value transfer is possible.
            valueLimit: BigInt(0),
            // Contract abi
            abi: spaceCowContractABI,
            // Function name
            functionName: "approve",
            // An array of conditions, each corresponding to an argument for
            // the function.
            args: [
              {
                // In this case, we are saying that the session key can only mint
                // NFTs to the account itself
                operator: ParamOperator.EQUAL,
                value: "0xF4EAD186dd9e843a6c59F1280FD89e9B4Cf93794",
              },
              {
                operator: ParamOperator.NOT_EQUAL,
                value: "",
              },
            ],
          },
        ],
      },
    })

    console.log("Session Key Validator: ", sessionKeyValidator)
    const sessionKeyAccount = await createKernelAccount(publicClient, {
      plugins: {
        defaultValidator: ecdsaValidator,
        validator: sessionKeyValidator,
      },
    })

    // Include the private key when you serialize the session key
    // const sessionPK = await serializeSessionKeyAccount(sessionKeyAccount, sessionPrivateKey)

    const sessionPK = await serializeSessionKeyAccount(sessionKeyAccount)
    localStorage.setItem('session_key', sessionPK)
  }, [web3]);

  return (
    <Card>
      <CardHeader id="setup-session-key">Normal Session Key</CardHeader>
      {getFaucetUrl() && (
        <div>
            <FormButton onClick={setupAdminSessionKey} disabled={false}>
              Setup Normal Session Key
            </FormButton>
        </div>
      )}
    </Card>
  );
};

export default SetupSessionKey;
