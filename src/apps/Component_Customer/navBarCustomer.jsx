import { useState } from 'react';
import { RxHamburgerMenu, RxCross2 } from 'react-icons/rx';
import { FiClipboard, FiLogOut } from 'react-icons/fi';
import logo from '../../assets/AquaBest logo.png';

export default function NavBarCustomer({ onHome, onOrder, onOrders, onLogout, page = 'home' }) {
  const [isOpen, setIsOpen] = useState(false);
  const go = (action) => { setIsOpen(false); action(); };
  return (
    <header className="customer-header">
      <nav className="navbar container-fluid px-3 px-md-4" aria-label="Main navigation">
        <button type="button" className="logo-button" onClick={() => go(onHome)} aria-label="AquaBest home">
          <img src={logo} alt="AquaBest" className="customer-logo" />
        </button>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className={'icon-button ' + (page === 'orders' ? 'active-icon' : '')} onClick={() => go(onOrders)} aria-label="My Orders"><FiClipboard size={22} /></button>
          <button type="button" className="icon-button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-controls="customer-menu" aria-label={isOpen ? 'Close menu' : 'Open menu'}>
            {isOpen ? <RxCross2 size={22} /> : <RxHamburgerMenu size={22} />}
          </button>
        </div>
      </nav>
      {isOpen && <div id="customer-menu" className="customer-menu container-fluid px-3 px-md-4">
        <button type="button" onClick={() => go(onHome)}>Home</button>
        <button type="button" onClick={() => go(onOrder)}>Order Water</button>
        <button type="button" onClick={() => go(onOrders)}>My Orders</button>
        <button type="button" onClick={() => go(onLogout)}><FiLogOut aria-hidden="true" /> Log out</button>
        <a href="tel:09994544981" onClick={() => setIsOpen(false)}>Call AquaBest</a>
      </div>}
    </header>
  );
}
