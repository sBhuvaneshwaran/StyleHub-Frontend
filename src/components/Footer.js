import React from "react";
import { Link } from "react-router-dom";
import { FiInstagram, FiFacebook, FiTwitter, FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import "./Footer.css";

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-inner">
                {/* Brand */}
                <div className="footer-brand">
                    <Link to="/" className="footer-logo">
                        <span>👗</span>
                        <span>StyleHub</span>
                    </Link>
                    <p className="footer-tagline">
                        Premium clothing for every occasion. Discover fashion that speaks your style.
                    </p>
                    <div className="footer-socials">
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                            <FiInstagram size={18} />
                        </a>
                        <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                            <FiFacebook size={18} />
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                            <FiTwitter size={18} />
                        </a>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="footer-col">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/?category=Men">Men</Link></li>
                        <li><Link to="/?category=Women">Women</Link></li>
                        <li><Link to="/?category=Kids">Kids</Link></li>
                        <li><Link to="/favorites">Favorites</Link></li>
                        <li><Link to="/cart">Cart</Link></li>
                    </ul>
                </div>

                {/* Customer Service */}
                <div className="footer-col">
                    <h4>Customer Service</h4>
                    <ul>
                        <li><a href="#faq">FAQ</a></li>
                        <li><a href="#returns">Returns &amp; Exchanges</a></li>
                        <li><a href="#shipping">Shipping Policy</a></li>
                        <li><a href="#size-guide">Size Guide</a></li>
                        <li><a href="#track">Track My Order</a></li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="footer-col">
                    <h4>Contact Us</h4>
                    <ul className="footer-contact">
                        <li>
                            <FiMapPin size={14} />
                            <span>42 Fashion Street, Mumbai, India</span>
                        </li>
                        <li>
                            <FiPhone size={14} />
                            <span>+91 98765 43210</span>
                        </li>
                        <li>
                            <FiMail size={14} />
                            <span>hello@stylehub.in</span>
                        </li>
                    </ul>
                    {/* <div className="footer-platforms">
                        <p>Also available on</p>
                        <div className="platform-badges">
                            <a href="https://www.flipkart.com" target="_blank" rel="noreferrer" className="platform-badge flipkart">
                                Flipkart
                            </a>
                            <a href="https://www.amazon.in" target="_blank" rel="noreferrer" className="platform-badge amazon">
                                Amazon
                            </a>
                        </div>
                    </div> */}
                </div>
            </div>

            <div className="footer-bottom">
                <p>© {new Date().getFullYear()} StyleHub. All rights reserved. Made with ❤️ in India.</p>
                <div className="footer-legal">
                    <a href="#privacy">Privacy Policy</a>
                    <a href="#terms">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
