import React, { useCallback, useEffect, useState } from 'react';
import Divider from '@/components/ui/Divider';
import { useMagic } from '../MagicProvider';
import FormButton from '@/components/ui/FormButton';
import FormInput from '@/components/ui/FormInput';
import ErrorText from '@/components/ui/ErrorText';
import Card from '@/components/ui/Card';
import { encodeFunctionData, parseAbi, publicActions, createPublicClient, http } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import CardHeader from '@/components/ui/CardHeader';
import { getFaucetUrl, getNetworkToken } from '@/utils/network';
import showToast from '@/utils/showToast';
import Spacer from '@/components/ui/Spacer';
import TransactionHistory from '@/components/ui/TransactionHistory';
import Image from 'next/image';
import Link from 'public/link.svg';
import { logout } from '@/utils/common';
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
  const [token, setToken] = useState('');
  useEffect(() => {
    setToken(localStorage.getItem('token') ?? '');
  }, [setToken]);

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
	const spaceCowContractAddress = "0xC6348A8060fF6B4518639A96Bc5A5Ae3c869c50D"
	const contractAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863"
	const spaceCowContractABI = [
	  "function mintTo(address _to, string _uri) public",
	  "function balanceOf(address owner) external view returns (uint256 balance)",
    "function approve(address owner, uint256 value) external view returns (bool approved)",
	]
	const contractABI = [
		"function mint(address _to) public",
		"function balanceOf(address owner) external view returns (uint256 balance)",
	]


  const mintNFT = useCallback(async () => {
    const contract = new web3.eth.Contract(parseAbi(contractABI), contractAddress);
		console.log(contract.methods);
    contract.methods.mint(toAddress).send({
      from: toAddress,
      to_: toAddress
    }).on('transactionHash', function(hash) {
      console.log("Transaction Hash: ", hash)
    }).on('receipt', function(receipt){
      console.log("Receipt: ", receipt)
    }).on('confirmation', function(confirmationNumber, receipt){
      console.log("Confirmation: ", confirmationNumber)
    }).on('error', function(error, receipt) {
      console.log("Error: ", error)
    })
    console.log(contract.options.jsonInterface);

  }, [web3, publicAddress, toAddress]);

	const mintWithSessionKey = useCallback(async (mintCow: boolean) => {
    console.log('Minting With Normal Session Key')
		let mintContract:string = contractAddress
		let mintABI:string[] = contractABI
		let functionName:string = "mint"
		let args:string[] = [toAddress]

		if (mintCow) {
			mintContract = spaceCowContractAddress
			mintABI = parseAbi(spaceCowContractABI)
			functionName = "mintTo"
			const metadata = {
				name: "Space Cow",
				image: "https://i.imgur.com/lGcIdfj.jpeg",
			}

			args = [toAddress, JSON.stringify(metadata)]
		}

    const magicProvider = await magic.wallet.getProvider();
		const magic_signer = await providerToSmartAccountSigner(magicProvider);

		const publicClient = createPublicClient({
			chain: polygonMumbai,
			transport: http("https://rpc.zerodev.app/api/v2/bundler/3b03e7bc-8dc5-46ff-9ef4-4a08e0cf2621"),
		})
		const sessionKeyAccount = await deserializeSessionKeyAccount(publicClient, sessionKey, magic_signer)

		const kernelClient = createKernelAccountClient({
			account: sessionKeyAccount,
			chain: polygonMumbai,
			transport: http("https://rpc.zerodev.app/api/v2/bundler/3b03e7bc-8dc5-46ff-9ef4-4a08e0cf2621"),
			sponsorUserOperation: async ({ userOperation }): Promise<UserOperation> => {
				const kernelPaymaster = createZeroDevPaymasterClient({
					chain: polygonMumbai,
					transport: http("https://rpc.zerodev.app/api/v2/paymaster/3b03e7bc-8dc5-46ff-9ef4-4a08e0cf2621"),
				})
				return kernelPaymaster.sponsorUserOperation({userOperation},)
			},
		})
		console.log("My SCA address:", kernelClient.account.address)


		const userOpHash = await kernelClient.sendUserOperation({
			userOperation: {
				callData: await sessionKeyAccount.encodeCallData({
					to: mintContract,
					value: BigInt(0),
					data: encodeFunctionData({
						abi: mintABI,
						functionName: functionName,
						args: args,
					}),
				}),
			},
		})

		console.log("Destination addr:", toAddress)
		console.log("userOp hash:", userOpHash)
		if (publicAddress == '') {
      await logout(setToken, magic);
		}
	});

  return (
    <Card>
      <CardHeader id="mint-nft">Normal Session Key Mint</CardHeader>
      <FormInput
        value={toAddress}
        onChange={(e: any) => setToAddress(e.target.value)}
        placeholder="Receiving Address"
      />
      {toAddressError ? <ErrorText>Invalid address</ErrorText> : null}
			{sessionKey.length > 0 ? (
				<FormButton onClick={() => mintWithSessionKey(true)} disabled={!toAddress || disabled}>
					Mint With Normal Session Key
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
