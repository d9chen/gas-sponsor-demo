import { useCallback, useEffect, useMemo, useState } from 'react';
import Divider from '@/components/ui/Divider';
import { SessionKeyProps } from '@/utils/types';
import { logout } from '@/utils/common';
import { useMagic } from '../MagicProvider';
import Card from '@/components/ui/Card';
import CardHeader from '@/components/ui/CardHeader';
import CardLabel from '@/components/ui/CardLabel';
import Spinner from '@/components/ui/Spinner';
import { getNetworkName, getNetworkToken } from '@/utils/network';

const SessionKeyInfo = () => {
  const [sessionKey, setSessionKey] = useState('');

  useEffect(() => {
    setSessionKey(localStorage.getItem('session_key') ?? '');
  }, [setSessionKey]);

  return (
    <Card>
      <CardLabel leftHeader="SessionKey" />
      <div className="code">{sessionKey?.length == 0 ? 'Fetching session key..' : sessionKey}</div>
    </Card>
  );
};

export default SessionKeyInfo;
