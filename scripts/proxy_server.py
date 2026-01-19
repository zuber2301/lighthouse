#!/usr/bin/env python3
import http.server
import socketserver
import urllib.request
import urllib.error
import sys
import os

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://127.0.0.1:18000')
PORT = int(os.environ.get('PORT', '5173'))


class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Serve static files from FRONTEND_DIR
        if path.startswith('/api/') or path == '/api':
            return ''
        return http.server.SimpleHTTPRequestHandler.translate_path(self, path).replace(os.getcwd(), FRONTEND_DIR)

    def do_proxy(self):
        # Remove leading /api
        path = self.path
        if path.startswith('/api'):
            proxied_path = path[len('/api'):]
            if not proxied_path:
                proxied_path = '/'
            url = BACKEND_URL + proxied_path
            try:
                req_headers = {k: v for k, v in self.headers.items()}
                data = None
                if 'Content-Length' in self.headers:
                    length = int(self.headers['Content-Length'])
                    data = self.rfile.read(length)
                req = urllib.request.Request(url, data=data, headers=req_headers, method=self.command)
                with urllib.request.urlopen(req, timeout=15) as resp:
                    self.send_response(resp.getcode())
                    for k, v in resp.getheaders():
                        # Skip hop-by-hop headers
                        if k.lower() in ('transfer-encoding', 'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'upgrade'):
                            continue
                        self.send_header(k, v)
                    self.end_headers()
                    body = resp.read()
                    if body:
                        self.wfile.write(body)
            except urllib.error.HTTPError as e:
                self.send_response(e.code)
                for k, v in e.headers.items():
                    self.send_header(k, v)
                self.end_headers()
                try:
                    self.wfile.write(e.read())
                except Exception:
                    pass
            except Exception as e:
                self.send_response(502)
                self.end_headers()
                self.wfile.write(b'Bad gateway')
            return True
        return False

    def do_GET(self):
        if self.do_proxy():
            return
        return super().do_GET()

    def do_POST(self):
        if self.do_proxy():
            return
        return super().do_POST()

    def do_PUT(self):
        if self.do_proxy():
            return
        return super().do_PUT()

    def do_DELETE(self):
        if self.do_proxy():
            return
        return super().do_DELETE()


if __name__ == '__main__':
    os.chdir(FRONTEND_DIR)
    handler = ProxyHandler
    with socketserver.TCPServer(('', PORT), handler) as httpd:
        print(f'Serving {FRONTEND_DIR} on port {PORT}, proxying /api to {BACKEND_URL}')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('Stopping')
            httpd.server_close()
