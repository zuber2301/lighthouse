from alembic.config import Config
from alembic import command
import os

# Run from backend directory context
cfg = Config('alembic.ini')
# use a fresh sqlite DB local to backend
cfg.set_main_option('sqlalchemy.url', 'sqlite:///./backend_dev.db')
cfg.set_main_option('script_location', os.path.join(os.getcwd(), 'migrations'))
print('Stamping to 0007...')
command.stamp(cfg, '0007')
print('Upgrading to head...')
command.upgrade(cfg, 'head')
print('Upgrade complete')
