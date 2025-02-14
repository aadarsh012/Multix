import React, { useMemo } from 'react'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { ApiOptions } from '@polkadot/api/types'
import { TypeRegistry } from '@polkadot/types'
import { useState, useEffect, createContext, useContext } from 'react'
import { useNetwork } from './NetworkContext'

type ApiContextProps = {
  children: React.ReactNode | React.ReactNode[]
  types?: ApiOptions['types']
}

const registry = new TypeRegistry()

export interface IApiContext {
  api?: false | ApiPromise
  chainInfo?: ChainInfoHuman
}

interface ChainInfoHuman {
  ss58Format: number
  tokenDecimals: number
  tokenSymbol: string
}

interface RawChainInfoHuman {
  ss58Format: string
  tokenDecimals: string[]
  tokenSymbol: string[]
}

const ApiContext = createContext<IApiContext | undefined>(undefined)

const ApiContextProvider = ({ children, types }: ApiContextProps) => {
  const { selectedNetworkInfo } = useNetwork()
  const [chainInfo, setChainInfo] = useState<ChainInfoHuman | undefined>()
  const [apiPromise, setApiPromise] = useState<ApiPromise | undefined>()
  const [isApiReady, setIsApiReady] = useState(false)
  const provider = useMemo(
    () => !!selectedNetworkInfo?.rpcUrl && new WsProvider(selectedNetworkInfo?.rpcUrl),
    [selectedNetworkInfo]
  )

  useEffect(() => {
    if (!provider) return

    // console.log('---> connecting to', provider.endpoint)
    setIsApiReady(false)
    const api = new ApiPromise({ provider, types })
    api.isReady.then((newApi) => setApiPromise(newApi)).catch(console.error)

    return () => {
      // console.log('<---disconnecting')
      setIsApiReady(false)
      !!api && api.disconnect()
      setApiPromise(undefined)
    }

    // prevent an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, types])

  useEffect(() => {
    if (!apiPromise || !provider) return

    apiPromise.isReady
      .then((api) => {
        setIsApiReady(true)
        if (types) {
          registry.register(types)
        }

        const info = api.registry.getChainProperties()
        const raw = info?.toHuman() as unknown as RawChainInfoHuman

        setChainInfo({
          // some parachains such as interlay have a comma in the format, e.g: "2,042"
          ss58Format: Number(raw?.ss58Format.replace(',', '')) || 0,
          tokenDecimals: Number(raw?.tokenDecimals[0]) || 0,
          tokenSymbol: raw?.tokenSymbol[0] || ''
        })
      })
      .catch(console.error)
  }, [apiPromise, provider, types])

  return (
    <ApiContext.Provider
      value={{
        api: isApiReady && apiPromise,
        chainInfo
      }}
    >
      {children}
    </ApiContext.Provider>
  )
}

const useApi = () => {
  const context = useContext(ApiContext)
  if (context === undefined) {
    throw new Error('useApi must be used within a ApiContextProvider')
  }
  return context
}

export { ApiContextProvider, useApi }
