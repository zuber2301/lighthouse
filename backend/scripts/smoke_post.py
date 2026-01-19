import http.client
import json

TENANT_ID = '971acfa8-3d39-488e-a251-d1faf91dab11'
HOST = '127.0.0.1'
PORT = 8000

conn = http.client.HTTPConnection(HOST, PORT)
# get dev token
conn.request('GET', f'/auth/dev-token?role=TENANT_ADMIN&tenant_id={TENANT_ID}')
r = conn.getresponse()
if r.status != 200:
    print('Failed to get dev token', r.status, r.read())
    raise SystemExit(1)

data = json.loads(r.read())
token = data.get('token')
print('token:', token[:20] + '...')

headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
# create badge
badge = {'name': 'Smoke Badge', 'points_value': 30, 'category': 'Value-based'}
conn.request('POST', '/badges/', body=json.dumps(badge), headers=headers)
r = conn.getresponse()
print('create badge status', r.status)
resp = r.read()
print('create badge resp', resp)

# POST recognition referencing badge if created
try:
    resp_json = json.loads(resp)
    badge_id = resp_json.get('id')
except Exception:
    badge_id = None

# create a nominee by calling dev-token for a non-platform role will create user; but easier: use the tenant admin as nominator and nominee (self-recognition allowed)
# fetch dev token user info contains user id? dev-token returns user id, but we used token for tenant admin created; dev-token created user earlier. We'll use that user's id from /auth/dev-token response user.id

user_id = data['user']['id']
print('user id', user_id)

recognition = {
    'nominee_id': user_id,
    'points': 10,
    'badge_id': badge_id,
    'message': 'Smoke test recognition',
    'is_public': True
}
conn.request('POST', '/recognitions/', body=json.dumps(recognition), headers=headers)
r = conn.getresponse()
print('create recognition status', r.status)
print('create recognition resp', r.read())
