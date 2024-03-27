import MagicProvider from '../components/magic/MagicProvider';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from '@/components/magic/Login';
import Dashboard from '@/components/magic/Dashboard';
import MagicDashboardRedirect from '@/components/magic/MagicDashboardRedirect';
import MintNFT from '@/components/magic/cards/MintNFTCard';
import AdminMintNFT from '@/components/magic/cards/MintNFTAdminCard';
import Spacer from '@/components/ui/Spacer';

export default function Home() {
  const [token, setToken] = useState('');
  const [sessionKey, setSessionKey] = useState('');

  useEffect(() => {
    setSessionKey(localStorage.getItem('session_key') ?? '');
  }, [setSessionKey]);


  useEffect(() => {
    setToken(localStorage.getItem('token') ?? '');
  }, [setToken]);


  return (
		  <div className="cards-container">
		  	<MagicProvider>
      	  <ToastContainer />
      	  {process.env.NEXT_PUBLIC_MAGIC_API_KEY ? (
      	    token.length > 0 ? (
      	      <Dashboard token={token} setToken={setToken} />
      	    ) : (
      	      <Login token={token} setToken={setToken} />
      	    )
      	  ) : (
      	    <MagicDashboardRedirect />
      	  )}
      	  {process.env.NEXT_PUBLIC_MAGIC_API_KEY ? (
      	    sessionKey.length > 0 && token.length == 0 ? (
              <MintNFT />
      	    ) : (
              null
      	    )
      	  ) : (
      	    <MagicDashboardRedirect />
      	  )}
      	  {process.env.NEXT_PUBLIC_MAGIC_API_KEY ? (
      	    sessionKey.length > 0 && token.length == 0 ? (
              <AdminMintNFT />
      	    ) : (
              null
      	    )
      	  ) : (
      	    <MagicDashboardRedirect />
      	  )}
      	</MagicProvider>
		  </div>
  );
}
