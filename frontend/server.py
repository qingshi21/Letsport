#!/usr/bin/env python3
import http.server
import socketserver
import os
from urllib.parse import urlparse

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def guess_type(self, path):
        """重写guess_type方法以正确处理JavaScript文件"""
        base, ext = os.path.splitext(path)
        if ext == '.js':
            return 'application/javascript; charset=utf-8'
        elif ext == '.css':
            return 'text/css; charset=utf-8'
        elif ext == '.html':
            return 'text/html; charset=utf-8'
        elif ext == '.json':
            return 'application/json; charset=utf-8'
        else:
            return super().guess_type(path)

PORT = 8080

with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
    print(f"前端服务器运行在端口 {PORT}")
    print(f"访问地址: http://localhost:{PORT}")
    httpd.serve_forever() 