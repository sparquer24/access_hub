"""
Main Seed Script for ECS Task Execution
======================================

This script is the entry point for running database seeds in ECS.
It should be executed as a separate one-time task before starting the API service.

Usage:
    python seed.py [--master-data] [--organizations] [--admin]

Environment Variables:
    DATABASE_URL: Database connection string (required)
    ENVIRONMENT: dev|stage|prod (optional, defaults to dev)
    LOG_LEVEL: DEBUG|INFO|WARNING|ERROR (optional, defaults to INFO)

Example ECS Task Definition:
    Container Override Command:
        ["python", "seed.py", "--master-data"]
"""

import sys
import argparse
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def run_master_data_seed():
    """Run master data seeding for primary organization"""
    try:
        logger.info("Starting master data seeding...")
        from app import create_app
        from app.seeds.seed_master_data import seed_all_master_data
        
        app = create_app()
        with app.app_context():
            success = seed_all_master_data()
            if success:
                logger.info("✓ Master data seeding completed successfully")
                return True
            else:
                logger.error("✗ Master data seeding failed")
                return False
    except Exception as e:
        logger.error(f"✗ Error during master data seeding: {str(e)}", exc_info=True)
        return False


def run_organization_seed():
    """Run organization data seeding"""
    try:
        logger.info("Starting organization data seeding...")
        from app import create_app
        from app.seeds.seed_organization_data import seed_data
        
        app = create_app()
        with app.app_context():
            seed_data()
            logger.info("✓ Organization data seeding completed successfully")
            return True
    except Exception as e:
        logger.error(f"✗ Error during organization data seeding: {str(e)}", exc_info=True)
        return False


def run_admin_seed():
    """Run admin user seeding"""
    try:
        logger.info("Starting admin user seeding...")
        from app import create_app
        from scripts.seed_admin import main
        
        app = create_app()
        with app.app_context():
            main()
            logger.info("✓ Admin user seeding completed successfully")
            return True
    except Exception as e:
        logger.error(f"✗ Error during admin user seeding: {str(e)}", exc_info=True)
        return False


def main():
    """Main entry point for seed script"""
    
    parser = argparse.ArgumentParser(
        description='Seed database with test/master data',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python seed.py --master-data      # Seed master data for primary organization
    python seed.py --organizations    # Seed organization test data
    python seed.py --admin            # Seed admin user
    python seed.py --all              # Run all seeds
        """
    )
    
    parser.add_argument('--master-data', action='store_true',
                        help='Run master data seeding (primary organization)')
    parser.add_argument('--organizations', action='store_true',
                        help='Run organization data seeding')
    parser.add_argument('--admin', action='store_true',
                        help='Run admin user seeding')
    parser.add_argument('--all', action='store_true',
                        help='Run all seed tasks')
    
    args = parser.parse_args()
    
    # If no arguments provided, default to master-data
    if not any([args.master_data, args.organizations, args.admin, args.all]):
        args.master_data = True
    
    logger.info("=" * 70)
    logger.info(f"Starting Database Seeding Task - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 70)
    
    results = {}
    
    if args.all or args.master_data:
        logger.info("\n[1/3] Running Master Data Seed...")
        results['master_data'] = run_master_data_seed()
    
    if args.all or args.organizations:
        logger.info("\n[2/3] Running Organization Data Seed...")
        results['organizations'] = run_organization_seed()
    
    if args.all or args.admin:
        logger.info("\n[3/3] Running Admin User Seed...")
        results['admin'] = run_admin_seed()
    
    # Summary
    logger.info("\n" + "=" * 70)
    logger.info("Seeding Summary")
    logger.info("=" * 70)
    
    all_success = all(results.values())
    
    for task, success in results.items():
        status = "✓ SUCCESS" if success else "✗ FAILED"
        logger.info(f"  {task}: {status}")
    
    logger.info("=" * 70)
    
    if all_success:
        logger.info("All seeding tasks completed successfully!")
        sys.exit(0)
    else:
        logger.error("One or more seeding tasks failed. Check logs above for details.")
        sys.exit(1)


if __name__ == "__main__":
    main()
