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

/*
// Get the Provider from Magic and convert it to a SmartAccountSigner
*/
const MintNFT = () => {
  const { magic, web3 } = useMagic();
  const [toAddress, setToAddress] = useState('');
  const [disabled, setDisabled] = useState(!toAddress);
  const [hash, setHash] = useState('');
  const [toAddressError, setToAddressError] = useState(false);


  // Magic setup
  const publicAddress = localStorage.getItem('user');
  useEffect(() => {
    setDisabled(!toAddress);
    setToAddressError(false);
  }, [toAddress]);

  const mintNFT = useCallback(async () => {
    // ZeroDev setup
    const magicProvider = await magic.wallet.getProvider();
    const smartAccountSigner = await providerToSmartAccountSigner(magicProvider);
    const contractAddress = '0x34bE7f35132E97915633BC1fc020364EA5134863'
    const contractABI = parseAbi([
      'function mint(address _to) public',
      'function balanceOf(address owner) external view returns (uint256 balance)'
    ])
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

  return (
    <Card>
      <CardHeader id="mint-nft">Mint NFT</CardHeader>
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
      <FormButton onClick={mintNFT} disabled={!toAddress || disabled}>
        Mint NFT
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

export default MintNFT;
