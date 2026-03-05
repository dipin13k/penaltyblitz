'use client'
import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export function FarcasterInit() {
  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready()
        console.log('sdk.actions.ready() called successfully')
      } catch (e) {
        console.error('sdk.actions.ready() failed:', e)
      }
    }
    init()
  }, [])
  return null
}
