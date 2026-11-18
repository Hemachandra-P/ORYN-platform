import sqlite3
import uuid
import datetime

conn = sqlite3.connect('nestsync.db')
c = conn.cursor()

# Communities table
c.execute('''CREATE TABLE IF NOT EXISTS communities (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    city VARCHAR(100) DEFAULT 'Chennai' NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL
)''')

# Marketplace memberships table
c.execute('''CREATE TABLE IF NOT EXISTS marketplace_memberships (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    plan_name VARCHAR(100) DEFAULT 'Marketplace 6-Month Membership' NOT NULL,
    price_paise INTEGER DEFAULT 2000 NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    current_period_start DATETIME NOT NULL,
    current_period_end DATETIME NOT NULL,
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    created_at DATETIME NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
)''')

# Check households columns
cols = [r[1] for r in c.execute('PRAGMA table_info(households)').fetchall()]
if 'community_id' not in cols:
    c.execute('ALTER TABLE households ADD COLUMN community_id VARCHAR(36) REFERENCES communities(id)')
if 'community_name' not in cols:
    c.execute('ALTER TABLE households ADD COLUMN community_name VARCHAR(255)')
if 'building' not in cols:
    c.execute('ALTER TABLE households ADD COLUMN building VARCHAR(100)')
if 'flat_number' not in cols:
    c.execute('ALTER TABLE households ADD COLUMN flat_number VARCHAR(100)')
if 'joining_password_hash' not in cols:
    c.execute('ALTER TABLE households ADD COLUMN joining_password_hash VARCHAR(255)')
if 'password_joining_enabled' not in cols:
    c.execute('ALTER TABLE households ADD COLUMN password_joining_enabled BOOLEAN DEFAULT 0')

# Check bills columns
b_cols = [r[1] for r in c.execute('PRAGMA table_info(bills)').fetchall()]
if 'custom_category' not in b_cols:
    c.execute('ALTER TABLE bills ADD COLUMN custom_category VARCHAR(100)')

# Check household_tasks columns
t_cols = [r[1] for r in c.execute('PRAGMA table_info(household_tasks)').fetchall()]
if 'creator_id' not in t_cols:
    c.execute('ALTER TABLE household_tasks ADD COLUMN creator_id VARCHAR(36)')

# Check household_invitations columns
i_cols = [r[1] for r in c.execute('PRAGMA table_info(household_invitations)').fetchall()]
if 'invitee_id' not in i_cols:
    c.execute('ALTER TABLE household_invitations ADD COLUMN invitee_id VARCHAR(36)')
if 'type' not in i_cols:
    c.execute("ALTER TABLE household_invitations ADD COLUMN type VARCHAR(50) DEFAULT 'invitation'")

# Seed default communities: Estancia, Abode Valley, Mini Matrix
default_comms = ['Estancia', 'Abode Valley', 'Mini Matrix']
for comm in default_comms:
    existing = c.execute('SELECT id FROM communities WHERE LOWER(name) = ?', (comm.lower(),)).fetchone()
    if not existing:
        c.execute('INSERT INTO communities (id, name, city, created_at) VALUES (?, ?, ?, ?)',
                  (str(uuid.uuid4()), comm, 'Chennai', datetime.datetime.utcnow().isoformat()))

conn.commit()
print('Database migrations successfully applied!')
conn.close()
