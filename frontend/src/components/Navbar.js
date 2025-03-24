import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Navbar.module.css';

export default function Navbar({ 
  account, 
  isAdmin, 
  isVoterWallet, 
  onConnect, 
  onSwitchLogin, 
  loginMethod = 'metamask' 
}) {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await onConnect();
    } catch (error) {
      console.error("Error connecting from navbar:", error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">
          <span>E-Voting System</span>
        </Link>
      </div>
      
      <div className={styles.navLinks}>
        <Link href="/">
          <span className={router.pathname === '/' ? styles.active : ''}>
            Home
          </span>
        </Link>
        
        <Link href="/explorer">
          <span className={router.pathname === '/explorer' ? styles.active : ''}>
            Explorer
          </span>
        </Link>
        
        {isAdmin && (
          <Link href="/admin/manage-elections">
            <span className={router.pathname.startsWith('/admin') ? styles.active : ''}>
              Admin
            </span>
          </Link>
        )}
      </div>
      
      <div className={styles.actions}>
        {account ? (
          <div className={styles.accountInfo}>
            {isAdmin && (
              <span className={styles.adminBadge}>Admin</span>
            )}
            {isVoterWallet && (
              <span className={styles.voterBadge}>Voter</span>
            )}
            <span className={styles.address}>{truncateAddress(account)}</span>
          </div>
        ) : (
          <div className={styles.loginActions}>
            <button 
              className={styles.connectButton}
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : loginMethod === 'metamask' ? 'Connect MetaMask' : 'Connect Wallet'}
            </button>
            
            <button
              className={styles.switchLoginButton}
              onClick={onSwitchLogin}
            >
              {loginMethod === 'metamask' ? 'Use Private Key' : 'Use MetaMask'}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}