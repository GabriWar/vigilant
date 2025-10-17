#!/usr/bin/env python3
"""
Generate VAPID keys for web push notifications
Run this script once to generate keys, then add them to your .env file
"""
import json
import os
from pathlib import Path


def generate_vapid_keys():
    """Generate VAPID key pair"""
    print("Generating VAPID keys for web push notifications...\n")
    
    try:
        from py_vapid import Vapid
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend
        
        # Generate new VAPID key with explicit backend
        vapid = Vapid()
        vapid.generate_keys()
        
        # Get the keys
        private_key = vapid.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')
        
        public_key = vapid.public_key.public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint
        )
        
        # Convert public key to base64 URL-safe format
        import base64
        public_key_b64 = base64.urlsafe_b64encode(public_key).decode('utf-8').rstrip('=')
        
        # Save to file
        keys_file = Path(__file__).parent / 'vapid_keys.json'
        with open(keys_file, 'w') as f:
            json.dump({
                'private_key': private_key,
                'public_key': public_key_b64
            }, f, indent=2)
        
        print("✅ VAPID keys generated successfully!\n")
        print("📄 Keys saved to:", keys_file)
        print("\n" + "="*60)
        print("Add these to your .env file:")
        print("="*60)
        print(f'\nVAPID_PRIVATE_KEY="{private_key.replace(chr(10), "\\n")}"')
        print(f'VAPID_PUBLIC_KEY="{public_key_b64}"')
        print(f'VAPID_CLAIM_EMAIL="mailto:your-email@example.com"')
        print("\n" + "="*60)
        print("\n⚠️  IMPORTANT: Keep the private key secret!")
        print("⚠️  Add vapid_keys.json to .gitignore\n")
        
    except Exception as e:
        print(f"❌ Error generating keys: {e}")
        print("\nTrying alternative method...")
        
        # Alternative method using ecdsa library
        try:
            from ecdsa import SigningKey, NIST256p
            import base64
            
            # Generate key pair
            sk = SigningKey.generate(curve=NIST256p)
            vk = sk.get_verifying_key()
            
            # Get private key in PEM format
            private_pem = sk.to_pem().decode('utf-8')
            
            # Get public key as uncompressed point
            public_point = b'\x04' + vk.to_string()
            public_key_b64 = base64.urlsafe_b64encode(public_point).decode('utf-8').rstrip('=')
            
            # Save to file
            keys_file = Path(__file__).parent / 'vapid_keys.json'
            with open(keys_file, 'w') as f:
                json.dump({
                    'private_key': private_pem,
                    'public_key': public_key_b64
                }, f, indent=2)
            
            print("✅ VAPID keys generated successfully (alternative method)!\n")
            print("📄 Keys saved to:", keys_file)
            print("\n" + "="*60)
            print("Add these to your .env file:")
            print("="*60)
            print(f'\nVAPID_PRIVATE_KEY="{private_pem.replace(chr(10), "\\n")}"')
            print(f'VAPID_PUBLIC_KEY="{public_key_b64}"')
            print(f'VAPID_CLAIM_EMAIL="mailto:your-email@example.com"')
            print("\n" + "="*60)
            
        except Exception as e2:
            print(f"❌ Alternative method also failed: {e2}")
            print("\nYou can generate keys manually or skip notifications for now.")


if __name__ == "__main__":
    # Check if dependencies are installed
    try:
        import py_vapid
    except ImportError:
        try:
            import ecdsa
        except ImportError:
            print("❌ Error: Required packages not installed")
            print("\nPlease install: pip install py-vapid cryptography")
            print("OR: pip install ecdsa")
            exit(1)
    
    generate_vapid_keys()
