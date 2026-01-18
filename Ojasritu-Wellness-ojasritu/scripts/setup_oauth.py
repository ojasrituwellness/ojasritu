#!/usr/bin/env python
"""
Setup script to configure Django Allauth for Google OAuth.
This ensures the Site domain and OAuth app are correctly configured.

Run this after migrations:
  python scripts/setup_oauth.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wellness_project.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
django.setup()

from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialApp
from django.conf import settings

def setup_site():
    """Ensure Django Site is configured for current domain."""
    # Determine the domain based on environment
    if settings.DEBUG:
        domain = 'localhost:8000'
        name = 'Ojasritu Wellness (Dev)'
    else:
        domain = 'ojasritu.co.in'
        name = 'Ojasritu Wellness'
    
    site, created = Site.objects.get_or_create(id=1)
    
    if site.domain != domain or site.name != name:
        site.domain = domain
        site.name = name
        site.save()
        status = "Created" if created else "Updated"
        print(f"✅ {status} Site: {site.domain}")
    else:
        print(f"✅ Site already configured: {site.domain}")

def setup_google_oauth():
    """Ensure Google OAuth app is configured in Django Allauth."""
    client_id = settings.GOOGLE_CLIENT_ID
    client_secret = settings.GOOGLE_CLIENT_SECRET
    
    if not client_id or not client_secret:
        print("⚠️  GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set. Skipping OAuth app setup.")
        print("   Set these environment variables to enable Google Sign-In.")
        return
    
    try:
        # Get or create Google OAuth app
        app, created = SocialApp.objects.get_or_create(
            provider='google',
            defaults={
                'name': 'Google OAuth',
                'client_id': client_id,
                'secret': client_secret,
            }
        )
        
        if created:
            print(f"✅ Created Google OAuth app")
        else:
            # Update if credentials changed
            if app.client_id != client_id or app.secret != client_secret:
                app.client_id = client_id
                app.secret = client_secret
                app.save()
                print(f"✅ Updated Google OAuth app credentials")
            else:
                print(f"✅ Google OAuth app already configured")
        
        # Ensure the Site is associated with the Google app
        site = Site.objects.get(id=1)
        
        if not app.sites.filter(id=site.id).exists():
            app.sites.add(site)
            print(f"✅ Associated Google OAuth app with Site: {site.domain}")
        else:
            print(f"✅ Google OAuth app already associated with Site: {site.domain}")
    except Exception as e:
        print(f"❌ Error setting up Google OAuth: {str(e)}")
        print(f"   Please check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET")

if __name__ == '__main__':
    print("\n=== Setting up Django Allauth ===\n")
    setup_site()
    setup_google_oauth()
    print("\n=== Setup complete ===\n")
