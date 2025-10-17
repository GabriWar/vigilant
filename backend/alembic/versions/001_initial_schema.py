"""initial schema

Revision ID: 001
Revises: 
Create Date: 2025-10-16

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create watchers table (unified monitors and requests)
    op.create_table(
        'watchers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('url', sa.Text(), nullable=False),
        sa.Column('method', sa.String(10), nullable=False, server_default='GET'),
        sa.Column('headers', sa.JSON(), nullable=True),
        sa.Column('body', sa.Text(), nullable=True),
        
        # Content and execution settings
        sa.Column('content_type', sa.String(50), nullable=False, server_default='auto'),  # auto, text, json, html, xml, image, pdf
        sa.Column('execution_mode', sa.String(50), nullable=False, server_default='scheduled'),  # scheduled, manual, both
        sa.Column('watch_interval', sa.Integer(), nullable=True),  # seconds, for scheduled execution
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        
        # Cookie settings
        sa.Column('save_cookies', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('use_cookies', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('cookie_watcher_id', sa.Integer(), nullable=True),
        
        # Change detection
        sa.Column('comparison_mode', sa.String(50), nullable=False, server_default='hash'),  # hash, content_aware, disabled
        
        # Status and tracking
        sa.Column('status', sa.String(50), nullable=True, server_default='pending'),  # pending, running, success, error
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('check_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('change_count', sa.Integer(), nullable=False, server_default='0'),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('last_checked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_changed_at', sa.DateTime(timezone=True), nullable=True),
        
        sa.ForeignKeyConstraint(['cookie_watcher_id'], ['watchers.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_watchers_id'), 'watchers', ['id'], unique=False)
    op.create_index(op.f('ix_watchers_name'), 'watchers', ['name'], unique=False)

    # Create cookies table
    op.create_table(
        'cookies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('watcher_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('domain', sa.String(255), nullable=True),
        sa.Column('path', sa.String(255), nullable=True),
        sa.Column('expires', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['watcher_id'], ['watchers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cookies_id'), 'cookies', ['id'], unique=False)

    # Create headers table
    op.create_table(
        'headers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_headers_name'), 'headers', ['name'], unique=False)

    # Create snapshots table
    op.create_table(
        'snapshots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('watcher_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.LargeBinary(), nullable=False),
        sa.Column('content_hash', sa.String(64), nullable=False),
        sa.Column('content_size', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['watcher_id'], ['watchers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_snapshots_content_hash'), 'snapshots', ['content_hash'], unique=False)
    op.create_index(op.f('ix_snapshots_id'), 'snapshots', ['id'], unique=False)

    # Create change_logs table
    op.create_table(
        'change_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('watcher_id', sa.Integer(), nullable=False),
        sa.Column('change_type', sa.String(50), nullable=False),
        sa.Column('old_content', sa.LargeBinary(), nullable=True),
        sa.Column('new_content', sa.LargeBinary(), nullable=False),
        sa.Column('old_hash', sa.String(64), nullable=True),
        sa.Column('new_hash', sa.String(64), nullable=False),
        sa.Column('diff', sa.LargeBinary(), nullable=True),
        sa.Column('old_size', sa.Integer(), nullable=True),
        sa.Column('new_size', sa.Integer(), nullable=False),
        sa.Column('archive_path', sa.String(500), nullable=True),
        sa.Column('detected_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['watcher_id'], ['watchers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_change_logs_detected_at'), 'change_logs', ['detected_at'], unique=False)
    op.create_index(op.f('ix_change_logs_id'), 'change_logs', ['id'], unique=False)

    # Create images table
    op.create_table(
        'images',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('watcher_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(500), nullable=False),
        sa.Column('original_url', sa.Text(), nullable=False),
        sa.Column('file_path', sa.String(1000), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('image_metadata', sa.JSON(), nullable=True),
        sa.Column('downloaded_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('source_date', sa.String(100), nullable=True),
        sa.ForeignKeyConstraint(['watcher_id'], ['watchers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_images_downloaded_at'), 'images', ['downloaded_at'], unique=False)
    op.create_index(op.f('ix_images_id'), 'images', ['id'], unique=False)

    # Create settings table
    op.create_table(
        'settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(255), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key')
    )
    op.create_index(op.f('ix_settings_key'), 'settings', ['key'], unique=True)

    # Create notification_subscriptions table
    op.create_table(
        'notification_subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('endpoint', sa.String(500), nullable=False),
        sa.Column('p256dh_key', sa.String(200), nullable=False),
        sa.Column('auth_key', sa.String(100), nullable=False),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('endpoint')
    )
    op.create_index(op.f('ix_notification_subscriptions_id'), 'notification_subscriptions', ['id'], unique=False)

    # Create workflows table
    op.create_table(
        'workflows',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('steps', sa.JSON(), nullable=False),
        # Step format: [
        #   {
        #     "order": 1,
        #     "watcher_id": 123,  # Changed from request_id
        #     "continue_on_error": false,
        #     "extract_variables": ["var1", "var2"]
        #   }
        # ]
        sa.Column('schedule_enabled', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('schedule_interval', sa.Integer(), nullable=True),
        sa.Column('last_executed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_execution_status', sa.String(50), nullable=True),
        sa.Column('last_execution_error', sa.Text(), nullable=True),
        sa.Column('execution_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('success_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('failure_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_workflows_name'), 'workflows', ['name'], unique=True)

    # Create variables table
    op.create_table(
        'variables',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('workflow_id', sa.Integer(), nullable=False),
        sa.Column('watcher_id', sa.Integer(), nullable=True),  # Changed from request_id
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('source', sa.Enum('response_body', 'response_header', 'cookie', 'static', 'random', name='variablesource'), nullable=False),
        sa.Column('extract_method', sa.Enum('json_path', 'regex', 'cookie_value', 'header_value', 'full_body', 'random_string', 'random_number', 'random_uuid', name='variableextractmethod'), nullable=False),
        sa.Column('extract_pattern', sa.Text(), nullable=True),
        sa.Column('random_length', sa.Integer(), nullable=True),
        sa.Column('random_format', sa.String(255), nullable=True),
        sa.Column('static_value', sa.Text(), nullable=True),
        sa.Column('current_value', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('last_extracted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['workflow_id'], ['workflows.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['watcher_id'], ['watchers.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Create workflow_executions table
    op.create_table(
        'workflow_executions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('workflow_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_seconds', sa.Float(), nullable=True),
        sa.Column('steps_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('steps_total', sa.Integer(), nullable=False),
        sa.Column('step_results', sa.JSON(), nullable=False),
        # Step result format: [
        #   {
        #     "order": 1,
        #     "watcher_id": 123,  # Changed from request_id
        #     "status": "success",
        #     "response_status": 200,
        #     "variables_extracted": {"token": "abc123"},
        #     "error": null,
        #     "duration_ms": 150
        #   }
        # ]
        sa.Column('variables_extracted', sa.JSON(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_step', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['workflow_id'], ['workflows.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('workflow_executions')
    op.drop_table('variables')
    op.drop_table('workflows')
    op.drop_table('notification_subscriptions')
    op.drop_table('settings')
    op.drop_table('images')
    op.drop_table('change_logs')
    op.drop_table('snapshots')
    op.drop_table('headers')
    op.drop_table('cookies')
    op.drop_table('watchers')

    # Drop enums (MySQL specific)
    op.execute('DROP TYPE IF EXISTS variablesource')
    op.execute('DROP TYPE IF EXISTS variableextractmethod')
