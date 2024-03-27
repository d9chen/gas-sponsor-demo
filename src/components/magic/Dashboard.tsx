import React from 'react';
import WalletMethods from './cards/WalletMethodsCard';
import MintNFT from './cards/MintNFTCard';
import AdminMintNFT from './cards/MintNFTAdminCard';
import AdminTransferNFT from './cards/TransferAdminNFTCard';
import TransferNFT from './cards/TransferNFTCard';
import SetupAdminSessionKey from './cards/SetupAdminSessionKeyCard';
import SetupSessionKey from './cards/SetupSessionKeyCard';
import SessionKeyInfo from './cards/SessionKeyInfoCard';
import Spacer from '@/components/ui/Spacer';
import { LoginProps, SessionKeyProps } from '@/utils/types';
import UserInfo from './cards/UserInfoCard';
import DevLinks from './DevLinks';
import Header from './Header';
import { useEffect, useState } from 'react';

export default function Dashboard({ token, setToken }: LoginProps) {
  const [sessionKey, setSessionKey] = useState('');

  useEffect(() => {
    setSessionKey(localStorage.getItem('session_key') ?? '');
  }, [setSessionKey]);
  //setToken(localStorage.getItem('token') ?? 'abc');

  return (
    <div className="home-page">
      <Header />
      <div className="cards-container">
        <UserInfo token={token} setToken={setToken} />
        <Spacer size={10} />

				{sessionKey.length > 0 ? (
					<MintNFT />
				) : (
					""
				)}
        <Spacer size={10} />
				{sessionKey.length > 0 ? (
					<AdminMintNFT />
				) : (
					""
				)}
        <Spacer size={10} />
				{sessionKey.length > 0 ? (
					<TransferNFT />
				) : (
					""
				)}
        <Spacer size={10} />
				{sessionKey.length > 0 ? (
					<AdminTransferNFT />
				) : (
					""
				)}
        <Spacer size={10} />
	{sessionKey.length > 0 ? (
					""
        ) : (
		<SetupSessionKey />
        )}
        <Spacer size={10} />
	{sessionKey.length > 0 ? (
		<SessionKeyInfo />
        ) : (
		<SetupAdminSessionKey />
        )}
        <Spacer size={10} />
        <WalletMethods token={token} setToken={setToken} />
        <Spacer size={15} />
      </div>
      <DevLinks primary />
    </div>
  );
}
