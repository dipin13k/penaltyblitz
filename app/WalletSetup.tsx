'use client'
import { useEffect } from 'react'

export default function WalletSetup() {
    useEffect(() => {
        ; (window as any).__triggerWalletConnect = () => {
            document.getElementById('hiddenwallet')?.click()
        }
    }, [])

    return null
}
