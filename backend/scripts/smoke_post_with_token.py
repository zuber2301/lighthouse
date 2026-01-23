import json
import http.client
from app.core.auth import create_access_token

HOST = '127.0.0.1'
PORT = 8000

# use existing tenant admin
admin_id = '4afd1236-f56b-4476-b2a0-bd653faf333a'
# tenant id
tenant_id = '971acfa8-3d39-488e-a251-d1faf91dab11'

# create token payload
payload = {
    'sub': admin_id,
    'tenant_id': tenant_id,
    'role': 'TENANT_ADMIN'
}

token = create_access_token(payload)
print('token:', token[:20] + '...')

conn = http.client.HTTPConnection(HOST, PORT)
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
# create badge
badge = {'name': 'Smoke Badge 2', 'points_value': 40, 'category': 'Value-based'}
conn.request('POST', '/badges/', body=json.dumps(badge), headers=headers)
r = conn.getresponse()
print('create badge status', r.status)
print(r.read())

# create recognition self-recognition
recognition = {
    'nominee_id': admin_id,
    'points': 40,
    'badge_id': None,
    'message': 'Smoke self recognition',
    'is_public': True
}
conn.request('POST', '/recognitions/', body=json.dumps(recognition), headers=headers)
r = conn.getresponse()
print('create recognition status', r.status)
print(r.read())
