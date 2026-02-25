#!/usr/bin/env python
"""
Simple runner to seed master data
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.seeds.seed_master_data import seed_all_master_data

if __name__ == "__main__":
    app = create_app()
    
    with app.app_context():
        print("\n" + "="*70)
        print("Starting Master Data Seeding")
        print("="*70 + "\n")
        
        try:
            success = seed_all_master_data()
            
            if success:
                print("\n" + "="*70)
                print("✓ Seeding completed successfully!")
                print("="*70)
                sys.exit(0)
            else:
                print("\n" + "="*70)
                print("✗ Seeding failed!")
                print("="*70)
                sys.exit(1)
        except Exception as e:
            print(f"\n✗ Error during seeding: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
