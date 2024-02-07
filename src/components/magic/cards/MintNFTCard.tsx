import React, { useCallback, useEffect, useState } from 'react';
import Divider from '@/components/ui/Divider';
import { useMagic } from '../MagicProvider';
import FormButton from '@/components/ui/FormButton';
import FormInput from '@/components/ui/FormInput';
import ErrorText from '@/components/ui/ErrorText';
import Card from '@/components/ui/Card';
import { encodeFunctionData, parseAbi, publicActions, createPublicClient, http } from "viem"
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
import {
  deserializeSessionKeyAccount,
  oneAddress,
} from "@zerodev/session-key"
import {
  createZeroDevPaymasterClient,
  createKernelAccountClient,
} from "@zerodev/sdk"

/*
// Get the Provider from Magic and convert it to a SmartAccountSigner
*/
const MintNFT = () => {
  const { magic, web3 } = useMagic();
  const [toAddress, setToAddress] = useState('');
  const [disabled, setDisabled] = useState(!toAddress);
  const [hash, setHash] = useState('');
  const [toAddressError, setToAddressError] = useState(false);
  const [sessionKey, setSessionKey] = useState('');
	const [publicAddress, setPublicAddress] = useState('');

  useEffect(() => {
    setSessionKey(localStorage.getItem('session_key') ?? '');
  }, [setSessionKey]);

	useEffect(() => {
		setPublicAddress(localStorage.getItem('user') ?? '');
	}, [setPublicAddress])
  // Magic setup
  useEffect(() => {
    setDisabled(!toAddress);
    setToAddressError(false);
  }, [toAddress]);
	const contractAddress = '0x34bE7f35132E97915633BC1fc020364EA5134863'
  const contractABI = parseAbi([
    'function mint(address _to) public',
    'function balanceOf(address owner) external view returns (uint256 balance)'
  ])

  const mintNFT = useCallback(async () => {
		console.log("Minting with smart account signer")
    // ZeroDev setup
    const magicProvider = await magic.wallet.getProvider();
    const smartAccountSigner = await providerToSmartAccountSigner(magicProvider);
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
    const userOpHash = await kernelClient.sendUserOperation({
      userOperation: {
        preVerificationGas: 50832n,
        callData: await kernelClient.account.encodeCallData({
          to: contractAddress,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: contractABI,
            functionName: "mint",
            args: [toAddress],
          })
        })
      }
    })
    console.log("Submitted UserOp:", userOpHash)

    // Wait for the UserOp to be included on-chain
    const bundlerClient = kernelClient.extend(bundlerActions)

    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
    })
    console.log("UserOp confirmed:", receipt.userOpHash)

    // Print NFT balance
    const publicClient = kernelClient.extend(publicActions)

    const nftBalance = await publicClient.readContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'balanceOf',
      args: [toAddress],
    })
    console.log(`NFT balance: ${nftBalance}`)
  }, [web3, publicAddress, toAddress]);

	const mintWithSessionKey = useCallback(async () => {
    console.log('Minting With Session Key')

		const publicClient = createPublicClient({
		  chain: polygonMumbai,
			transport: http("https://rpc.zerodev.app/api/v2/bundler/3b03e7bc-8dc5-46ff-9ef4-4a08e0cf2621"),
		})
	  const sessionKeyAccount = await deserializeSessionKeyAccount(publicClient, sessionKey)

	  const kernelClient = createKernelAccountClient({
	    account: sessionKeyAccount,
	    chain: polygonMumbai,
			transport: http("https://rpc.zerodev.app/api/v2/bundler/3b03e7bc-8dc5-46ff-9ef4-4a08e0cf2621"),
	    sponsorUserOperation: async ({ userOperation }): Promise<UserOperation> => {
	      const kernelPaymaster = createZeroDevPaymasterClient({
	        chain: polygonMumbai,
					transport: http("https://rpc.zerodev.app/api/v2/paymaster/3b03e7bc-8dc5-46ff-9ef4-4a08e0cf2621"),
	      })
	      return kernelPaymaster.sponsorUserOperation({
	        userOperation,
	      })
	    },
	  })

	  const userOpHash = await kernelClient.sendUserOperation({
	    userOperation: {
	      callData: await sessionKeyAccount.encodeCallData({
	        to: contractAddress,
	        value: BigInt(0),
	        data: encodeFunctionData({
	          abi: contractABI,
	          functionName: "mint",
	          args: [toAddress],
	        }),
	      }),
	    },
	  })

	  console.log("Destination addr:", toAddress)
	  console.log("userOp hash:", userOpHash)
	});

  return (
    <Card>
      <CardHeader id="mint-nft">Mint NFT</CardHeader>

      <FormInput
        value={toAddress}
        onChange={(e: any) => setToAddress(e.target.value)}
        placeholder="Receiving Address"
      />
      {toAddressError ? <ErrorText>Invalid address</ErrorText> : null}
			{sessionKey.length > 0 ? (
      	<FormButton onClick={mintWithSessionKey} disabled={!toAddress || disabled}>
      	  Mint NFT With Session Key
      	</FormButton>
			) : (
      	<FormButton onClick={mintNFT} disabled={!toAddress || disabled}>
      	  Mint NFT
      	</FormButton>
			)}

      {hash ? (
        <>
          <Spacer size={20} />
          <TransactionHistory />
        </>
      ) : null}
    </Card>
  );
};

export default MintNFT;
