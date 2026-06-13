'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, User, Shield, LogOut, Loader2 } from 'lucide-react'
import { useWeb3Auth } from '@/components/web3auth-provider'
import { useSmartAccount } from '@/lib/smart-account/smart-account-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

const navLinks = ['Product', 'How it Works', 'Developers', 'Docs']
const navIds = ['product', 'how-it-works', 'developers', 'tech-stack']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isConnected, userInfo, address, login, logout } = useWeb3Auth()
  const { smartAccountAddress, isDeployed, isCreating } = useSmartAccount()
  const router = useRouter()

  const handleLaunchApp = () => {
    if (isConnected) {
      router.push('/dashboard')
    } else {
      if (!login) {
        console.warn('Web3Auth not ready yet');
        return;
      }
      login()
    }
  }

  const handleLogin = () => {
    if (!login) {
      console.warn('Web3Auth not ready yet, please wait...');
      return;
    }
    login();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/autobounty-logo.svg"
            alt="AutoBounty"
            width={140}
            height={19}
            priority
            loading="eager"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link, i) => (
            <a
              key={link}
              href={`#${navIds[i]}`}
              className="text-sm text-[var(--text-dim)] hover:text-white transition-colors duration-200"
            >
              {link}
            </a>
          ))}
        </nav>

        {/* CTA & Wallet */}
        <div className="hidden md:flex items-center gap-3">
          {!isConnected ? (
            <button
              onClick={handleLogin}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--brand-teal)] text-black hover:bg-[var(--brand-blue)] transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!login}
            >
              Connect Wallet
            </button>
          ) : (
            <>
              <button
                onClick={handleLaunchApp}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--brand-teal)] text-black hover:bg-[var(--brand-blue)] transition-colors duration-200 cursor-pointer"
              >
                Launch App
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                    {userInfo?.profileImage ? (
                      <img
                        src={userInfo.profileImage}
                        alt="Profile"
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <User className="h-4 w-4 text-white" />
                    )}
                    <span className="text-sm text-white">
                      {userInfo?.name || formatAddress(address || '')}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-black border-white/10">
                  <DropdownMenuLabel className="text-white">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Account
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  
                  {/* User Info */}
                  {userInfo && (
                    <div className="px-2 py-2 space-y-1">
                      <div className="text-xs text-[var(--text-dim)]">Signed in as</div>
                      <div className="text-sm text-white font-mono">
                        {userInfo.email || userInfo.name}
                      </div>
                    </div>
                  )}
                  
                  {/* EOA Address */}
                  <div className="px-2 py-2 space-y-1">
                    <div className="text-xs text-[var(--text-dim)]">Wallet Address</div>
                    <div className="text-xs text-white font-mono break-all">
                      {address}
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator className="bg-white/10" />
                  
                  {/* Smart Account Status */}
                  <div className="px-2 py-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-white">
                        <Shield className="h-4 w-4 text-[var(--brand-teal)]" />
                        Smart Account
                      </div>
                      {isCreating ? (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Creating
                        </Badge>
                      ) : smartAccountAddress ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20">
                          None
                        </Badge>
                      )}
                    </div>
                    
                    {smartAccountAddress && (
                      <>
                        <div className="text-xs text-[var(--text-dim)]">Smart Account Address</div>
                        <div className="text-xs text-white font-mono break-all bg-white/5 p-2 rounded">
                          {smartAccountAddress}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-dim)]">Status</span>
                          {isDeployed ? (
                            <span className="text-emerald-500">Deployed ✓</span>
                          ) : (
                            <span className="text-yellow-500">Not Deployed</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <DropdownMenuSeparator className="bg-white/10" />
                  
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link, i) => (
            <a
              key={link}
              href={`#${navIds[i]}`}
              className="text-sm text-[var(--text-dim)] hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link}
            </a>
          ))}
          
          {!isConnected ? (
            <button
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--brand-teal)] text-black text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => { setMobileOpen(false); handleLogin(); }}
              disabled={!login}
            >
              Connect Wallet
            </button>
          ) : (
            <>
              <button
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--brand-teal)] text-black text-center cursor-pointer"
                onClick={() => { setMobileOpen(false); handleLaunchApp(); }}
              >
                Launch App
              </button>
              
              {/* Mobile User Info */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <div className="text-xs text-[var(--text-dim)]">Connected as</div>
                <div className="text-sm text-white">
                  {userInfo?.name || formatAddress(address || '')}
                </div>
                
                {smartAccountAddress && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-dim)]">
                      <Shield className="h-3 w-3" />
                      Smart Account {isDeployed ? '(Deployed)' : '(Not Deployed)'}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => { setMobileOpen(false); logout(); }}
                  className="w-full px-4 py-2 text-sm text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4 inline mr-2" />
                  Disconnect
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  )
}
