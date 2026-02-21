"""
Database backup and restore utilities
"""

import os
import subprocess
import shutil
import zipfile
from datetime import datetime
import logging
from app.config import Config
from sqlalchemy import create_engine, text
import json

logger = logging.getLogger(__name__)


class DatabaseBackup:
    """Database backup and restore utility"""
    
    def __init__(self, config=None):
        self.config = config or Config()
        self.backup_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backups')
        self.ensure_backup_directory()
    
    def ensure_backup_directory(self):
        """Ensure backup directory exists"""
        if not os.path.exists(self.backup_dir):
            os.makedirs(self.backup_dir)
    
    def create_backup(self, backup_name=None, include_data=True, compress=True):
        """
        Create a database backup
        
        Args:
            backup_name: Name for the backup file
            include_data: Whether to include data or just schema
            compress: Whether to compress the backup
        """
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_name = backup_name or f'backup_{timestamp}'
            
            # Determine database type and create backup accordingly
            db_url = self.config.SQLALCHEMY_DATABASE_URI
            
            if db_url.startswith('sqlite'):
                return self._backup_sqlite(backup_name, compress)
            elif db_url.startswith('postgresql'):
                return self._backup_postgresql(backup_name, include_data, compress)
            elif db_url.startswith('mysql'):
                return self._backup_mysql(backup_name, include_data, compress)
            else:
                raise ValueError(f"Unsupported database type: {db_url}")
                
        except Exception as e:
            logger.error(f"Backup failed: {e}")
            return False, str(e)
    
    def _backup_sqlite(self, backup_name, compress):
        """Backup SQLite database"""
        try:
            # Get SQLite database path
            db_url = self.config.SQLALCHEMY_DATABASE_URI
            db_path = db_url.replace('sqlite:///', '')
            
            if not os.path.exists(db_path):
                return False, "Database file not found"
            
            # Create backup
            backup_path = os.path.join(self.backup_dir, f'{backup_name}.db')
            shutil.copy2(db_path, backup_path)
            
            # Create metadata file
            metadata = {
                'backup_name': backup_name,
                'created_at': datetime.now().isoformat(),
                'database_type': 'sqlite',
                'original_path': db_path,
                'backup_size': os.path.getsize(backup_path)
            }
            
            metadata_path = os.path.join(self.backup_dir, f'{backup_name}.json')
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            # Compress if requested
            if compress:
                zip_path = os.path.join(self.backup_dir, f'{backup_name}.zip')
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    zipf.write(backup_path, f'{backup_name}.db')
                    zipf.write(metadata_path, f'{backup_name}.json')
                
                # Remove uncompressed files
                os.remove(backup_path)
                os.remove(metadata_path)
                
                logger.info(f"SQLite backup created: {zip_path}")
                return True, zip_path
            else:
                logger.info(f"SQLite backup created: {backup_path}")
                return True, backup_path
                
        except Exception as e:
            logger.error(f"SQLite backup failed: {e}")
            return False, str(e)
    
    def _backup_postgresql(self, backup_name, include_data, compress):
        """Backup PostgreSQL database"""
        try:
            # Parse database URL
            db_url = self.config.SQLALCHEMY_DATABASE_URI
            # Extract connection details (simplified parsing)
            
            # Create pg_dump command
            dump_file = os.path.join(self.backup_dir, f'{backup_name}.sql')
            
            cmd = [
                'pg_dump',
                '--no-password',
                '--format=custom' if compress else '--format=plain',
                '--file', dump_file
            ]
            
            if not include_data:
                cmd.append('--schema-only')
            
            # Add database URL
            cmd.append(db_url)
            
            # Execute backup command
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                # Create metadata file
                metadata = {
                    'backup_name': backup_name,
                    'created_at': datetime.now().isoformat(),
                    'database_type': 'postgresql',
                    'include_data': include_data,
                    'compressed': compress,
                    'backup_size': os.path.getsize(dump_file)
                }
                
                metadata_path = os.path.join(self.backup_dir, f'{backup_name}.json')
                with open(metadata_path, 'w') as f:
                    json.dump(metadata, f, indent=2)
                
                logger.info(f"PostgreSQL backup created: {dump_file}")
                return True, dump_file
            else:
                logger.error(f"pg_dump failed: {result.stderr}")
                return False, result.stderr
                
        except Exception as e:
            logger.error(f"PostgreSQL backup failed: {e}")
            return False, str(e)
    
    def _backup_mysql(self, backup_name, include_data, compress):
        """Backup MySQL database"""
        try:
            # Parse database URL and create mysqldump command
            dump_file = os.path.join(self.backup_dir, f'{backup_name}.sql')
            
            cmd = [
                'mysqldump',
                '--single-transaction',
                '--routines',
                '--triggers'
            ]
            
            if not include_data:
                cmd.append('--no-data')
            
            # Add result file
            cmd.extend(['--result-file', dump_file])
            
            # Add database connection details (would need proper URL parsing)
            # cmd.extend(['--host', host, '--user', user, '--password', password, database])
            
            # Execute backup command
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                # Compress if requested
                if compress:
                    compressed_file = f'{dump_file}.gz'
                    with open(dump_file, 'rb') as f_in:
                        import gzip
                        with gzip.open(compressed_file, 'wb') as f_out:
                            shutil.copyfileobj(f_in, f_out)
                    
                    os.remove(dump_file)
                    dump_file = compressed_file
                
                # Create metadata
                metadata = {
                    'backup_name': backup_name,
                    'created_at': datetime.now().isoformat(),
                    'database_type': 'mysql',
                    'include_data': include_data,
                    'compressed': compress,
                    'backup_size': os.path.getsize(dump_file)
                }
                
                metadata_path = os.path.join(self.backup_dir, f'{backup_name}.json')
                with open(metadata_path, 'w') as f:
                    json.dump(metadata, f, indent=2)
                
                logger.info(f"MySQL backup created: {dump_file}")
                return True, dump_file
            else:
                logger.error(f"mysqldump failed: {result.stderr}")
                return False, result.stderr
                
        except Exception as e:
            logger.error(f"MySQL backup failed: {e}")
            return False, str(e)
    
    def list_backups(self):
        """List available backups"""
        backups = []
        
        try:
            for filename in os.listdir(self.backup_dir):
                if filename.endswith('.json'):
                    metadata_path = os.path.join(self.backup_dir, filename)
                    with open(metadata_path, 'r') as f:
                        metadata = json.load(f)
                    backups.append(metadata)
            
            # Sort by creation date (newest first)
            backups.sort(key=lambda x: x['created_at'], reverse=True)
            
        except Exception as e:
            logger.error(f"Failed to list backups: {e}")
        
        return backups
    
    def restore_backup(self, backup_name):
        """Restore database from backup"""
        try:
            metadata_path = os.path.join(self.backup_dir, f'{backup_name}.json')
            
            if not os.path.exists(metadata_path):
                return False, "Backup metadata not found"
            
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            db_type = metadata['database_type']
            
            if db_type == 'sqlite':
                return self._restore_sqlite(backup_name, metadata)
            elif db_type == 'postgresql':
                return self._restore_postgresql(backup_name, metadata)
            elif db_type == 'mysql':
                return self._restore_mysql(backup_name, metadata)
            else:
                return False, f"Unsupported database type: {db_type}"
                
        except Exception as e:
            logger.error(f"Restore failed: {e}")
            return False, str(e)
    
    def _restore_sqlite(self, backup_name, metadata):
        """Restore SQLite database"""
        try:
            # Get current database path
            db_url = self.config.SQLALCHEMY_DATABASE_URI
            db_path = db_url.replace('sqlite:///', '')
            
            # Backup existing database
            if os.path.exists(db_path):
                backup_existing = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                shutil.copy2(db_path, backup_existing)
                logger.info(f"Existing database backed up to: {backup_existing}")
            
            # Restore from backup
            backup_file = os.path.join(self.backup_dir, f'{backup_name}.db')
            
            if not os.path.exists(backup_file):
                # Try compressed version
                zip_file = os.path.join(self.backup_dir, f'{backup_name}.zip')
                if os.path.exists(zip_file):
                    with zipfile.ZipFile(zip_file, 'r') as zipf:
                        zipf.extract(f'{backup_name}.db', self.backup_dir)
            
            if os.path.exists(backup_file):
                shutil.copy2(backup_file, db_path)
                logger.info(f"Database restored from: {backup_file}")
                return True, "Database restored successfully"
            else:
                return False, "Backup file not found"
                
        except Exception as e:
            logger.error(f"SQLite restore failed: {e}")
            return False, str(e)
    
    def _restore_postgresql(self, backup_name, metadata):
        """Restore PostgreSQL database"""
        try:
            backup_file = os.path.join(self.backup_dir, f'{backup_name}.sql')
            
            if not os.path.exists(backup_file):
                return False, "Backup file not found"
            
            # Create pg_restore command
            cmd = [
                'pg_restore',
                '--no-password',
                '--clean',
                '--if-exists',
                '--dbname', self.config.SQLALCHEMY_DATABASE_URI,
                backup_file
            ]
            
            # Execute restore command
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info(f"PostgreSQL database restored from: {backup_file}")
                return True, "Database restored successfully"
            else:
                logger.error(f"pg_restore failed: {result.stderr}")
                return False, result.stderr
                
        except Exception as e:
            logger.error(f"PostgreSQL restore failed: {e}")
            return False, str(e)
    
    def _restore_mysql(self, backup_name, metadata):
        """Restore MySQL database"""
        try:
            backup_file = os.path.join(self.backup_dir, f'{backup_name}.sql')
            
            # Handle compressed backups
            if metadata.get('compressed') and backup_file.endswith('.sql'):
                backup_file += '.gz'
            
            if not os.path.exists(backup_file):
                return False, "Backup file not found"
            
            # Prepare mysql command
            cmd = ['mysql']
            # Add connection parameters (would need proper URL parsing)
            
            # Execute restore
            if backup_file.endswith('.gz'):
                import gzip
                with gzip.open(backup_file, 'rt') as f:
                    sql_content = f.read()
            else:
                with open(backup_file, 'r') as f:
                    sql_content = f.read()
            
            # Execute SQL (simplified - would need proper implementation)
            engine = create_engine(self.config.SQLALCHEMY_DATABASE_URI)
            with engine.connect() as conn:
                conn.execute(text(sql_content))
                conn.commit()
            
            logger.info(f"MySQL database restored from: {backup_file}")
            return True, "Database restored successfully"
            
        except Exception as e:
            logger.error(f"MySQL restore failed: {e}")
            return False, str(e)
    
    def delete_backup(self, backup_name):
        """Delete a backup"""
        try:
            # Delete metadata file
            metadata_path = os.path.join(self.backup_dir, f'{backup_name}.json')
            if os.path.exists(metadata_path):
                os.remove(metadata_path)
            
            # Delete backup files
            for ext in ['.db', '.sql', '.sql.gz', '.zip']:
                backup_file = os.path.join(self.backup_dir, f'{backup_name}{ext}')
                if os.path.exists(backup_file):
                    os.remove(backup_file)
            
            logger.info(f"Backup deleted: {backup_name}")
            return True, "Backup deleted successfully"
            
        except Exception as e:
            logger.error(f"Failed to delete backup: {e}")
            return False, str(e)
    
    def cleanup_old_backups(self, keep_days=30):
        """Clean up backups older than specified days"""
        try:
            cutoff_date = datetime.now().timestamp() - (keep_days * 24 * 60 * 60)
            deleted_count = 0
            
            for filename in os.listdir(self.backup_dir):
                file_path = os.path.join(self.backup_dir, filename)
                file_time = os.path.getmtime(file_path)
                
                if file_time < cutoff_date:
                    os.remove(file_path)
                    deleted_count += 1
            
            logger.info(f"Cleaned up {deleted_count} old backup files")
            return True, f"Deleted {deleted_count} old backup files"
            
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
            return False, str(e)


# Global backup instance
db_backup = DatabaseBackup()