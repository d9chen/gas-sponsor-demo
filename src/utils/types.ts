import { Dispatch, SetStateAction } from 'react'

export type LoginProps = {
  token: string
  setToken: Dispatch<SetStateAction<string>>
}

export type SessionKeyProps = {
  sessionKey: string
  setSessionKey: Dispatch<SetStateAction<string>>
}

export type { Magic } from '../components/magic/MagicProvider'
