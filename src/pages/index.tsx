import MagicProvider from '../components/magic/MagicProvider';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from '@/components/magic/Login';
import Dashboard from '@/components/magic/Dashboard';
import MagicDashboardRedirect from '@/components/magic/MagicDashboardRedirect';
import MintNFT from '@/components/magic/cards/MintNFTCard';
import Spacer from '@/components/ui/Spacer';

export default function Home() {
  const [token, setToken] = useState('');


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
				<Spacer size={10} />
				<MintNFT />
    	</MagicProvider>
		</div>
  );
}
