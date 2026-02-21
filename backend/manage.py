#!/usr/bin/env python
"""
Management script for database operations and seeding.
"""
import click
from flask.cli import FlaskGroup
from app import create_app
from app.extensions import db


def create_cli_app():
    """Create Flask app for CLI"""
    return create_app()


@click.group(cls=FlaskGroup, create_app=create_cli_app)
def cli():
    """Management script for VMS application"""
    pass


@cli.command()
def init_db():
    """Initialize the database with tables"""
    db.create_all()
    click.echo("✅ Database tables created successfully")


@cli.command()
def seed_roles():
    """Seed default roles and permissions"""
    from app.seeds.seed_master_data import create_roles
    create_roles()
    db.session.commit()


@cli.command()
def seed_super_admin():
    """Seed default super admin"""
    # Note: seed_master_data creates users and employees including admins
    from app.seeds.seed_master_data import seed_all_master_data
    seed_all_master_data()


@cli.command()
def seed_sparquer():
    """Seed primary organization (India IT Park)"""
    from app.seeds.seed_master_data import seed_all_master_data
    seed_all_master_data()


@cli.command()
def seed_all():
    """Run master data seeding"""
    from app.seeds.seed_master_data import seed_all_master_data
    seed_all_master_data()


@cli.command()
def verify_seeds():
    """Check SEED_VALIDATION_REPORT.md for verification status"""
    click.echo("Verification scripts are consolidated. Please refer to SEED_VALIDATION_REPORT.md")


@cli.command()
@click.option('--email', prompt=True, help='Super admin email')
@click.option('--username', prompt=True, help='Super admin username')
@click.option('--password', prompt=True, hide_input=True, confirmation_prompt=True, help='Super admin password')
def create_superadmin(email, username, password):
    """Create a custom super admin user"""
    from app.models import User, Role
    from werkzeug.security import generate_password_hash
    
    # Get super_admin role
    role = Role.query.filter_by(name='super_admin').first()
    if not role:
        click.echo("❌ Error: super_admin role not found. Run 'seed_roles' first.")
        return
    
    # Check if user exists
    if User.query.filter_by(email=email).first():
        click.echo(f"❌ Error: User with email {email} already exists")
        return
    
    if User.query.filter_by(username=username).first():
        click.echo(f"❌ Error: User with username {username} already exists")
        return
    
    # Create super admin
    password_hash = generate_password_hash(password)
    user = User(
        email=email,
        username=username,
        password_hash=password_hash,
        role_id=role.id,
        organization_id=None,  # Super admin has no organization
        is_active=True
    )
    
    db.session.add(user)
    db.session.commit()
    
    click.echo(f"✅ Super admin created successfully!")
    click.echo(f"   Email: {email}")
    click.echo(f"   Username: {username}")


@cli.command()
def reset_db():
    """Drop all tables and recreate them (USE WITH CAUTION!)"""
    if click.confirm('⚠️  This will delete all data. Are you sure?'):
        db.drop_all()
        db.create_all()
        click.echo("✅ Database reset successfully")
    else:
        click.echo("Operation cancelled")


if __name__ == '__main__':
    cli()